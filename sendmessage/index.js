const AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

const TABLE_NAME = "SampleWebSocketConnect_DB";
const MESSAGE_TABLE = "SendMessage_DB";

exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const getConnection = {
    TableName: TABLE_NAME,
    Key: {
      connectionId,
    },
  };
  const connectionData = await ddb.get(getConnection).promise();
  const { channelId } = connectionData.Item;

  const postData = JSON.parse(event.body).data;
  const { addToCart } = postData;
  const messageParams = {
    TableName: MESSAGE_TABLE,
    Key: {
      channelId,
    },
  };
  //sample of menu on cart
  /**
   * [{
   * "menuId": "1",
   * "amount": 1,},
   * {
   * "menuId": "2",
   * "amount": 1}]
   */

  const apiGateway = new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint:
      event.requestContext.domainName + "/" + event.requestContext.stage,
  });

  const postCalls = connectionData.Items.map(async ({ connectionId }) => {
    try {
      await apiGateway
        .postToConnection({ ConnectionId: connectionId, Data: postData })
        .promise();
    } catch (e) {
      if (e.statusCode === 410) {
        console.log(`Found stale connection, deleting ${connectionId}`);
        await ddb
          .delete({ TableName: TABLE_NAME, Key: { connectionId } })
          .promise();
      } else {
        throw e;
      }
    }
  });
  await Promise.all(postCalls);
  return { statusCode: 200, body: "Data sent." };
};
