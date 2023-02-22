const AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: process.env.AWS_REGION,
});

exports.handler = async (event) => {
  const { channelId } = JSON.parse(event.body).data;
  const updateParams = {
    TableName: "SampleWebSocketConnect_DB",
    Key: {
      connectionId: event.requestContext.connectionId,
    },
    updateExpression: "set channelId = :channelId",
    ExpressionAttributeValues: {
      ":channelId": channelId,
    },
  };

  try {
    await ddb.update(updateParams).promise();
  } catch (err) {
    return {
      statusCode: 500,
      body: "Failed to update: " + JSON.stringify(err),
    };
  }

  return { statusCode: 200, body: "Connected." };
};
