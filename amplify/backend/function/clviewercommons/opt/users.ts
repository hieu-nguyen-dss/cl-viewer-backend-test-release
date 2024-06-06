import AWS from 'aws-sdk';
const STORAGE_CLVIEWERUSERDATA_NAME = process.env.STORAGE_CLVIEWERUSERDATA_NAME;

const dynamoDbClient = new AWS.DynamoDB.DocumentClient();

export const createNewUser = async (userId: string, userName: string, email: string, corporationId: string, corporationName: string, refreshToken: string) => {
  const putItemInput = {
    TableName: STORAGE_CLVIEWERUSERDATA_NAME,
    Item: {
      pk: `USER#${userId}`,
      sk: 'USER',
      userId: userId,
      userName,
      email,
      corporationId,
      corporationName,
      refreshToken,
    },
  };

  await dynamoDbClient.put(putItemInput).promise();
};

export const getUserById = async (userId: string) => {
  const getItemInput = {
    TableName: STORAGE_CLVIEWERUSERDATA_NAME,
    Key: {
      pk: `USER#${userId}`,
      sk: 'USER',
    },
  };
  return (await dynamoDbClient.get(getItemInput).promise()).Item;
};

export const setUserDetails = async (userId: string, valueMap: any) => {
  const updateExpression = Object.keys(valueMap)
    .map((key) => `${key} = :${key}`)
    .join(', ');
  const expressionAttributeValues = {};
  Object.keys(valueMap).forEach((key) => {
    expressionAttributeValues[`:${key}`] = valueMap[key];
  });
  const updateItemInput = {
    TableName: STORAGE_CLVIEWERUSERDATA_NAME,
    Key: {
      pk: `USER#${userId}`,
      sk: 'USER',
    },
    UpdateExpression: `SET ${updateExpression}`,
    ExpressionAttributeValues: expressionAttributeValues,
  };

  await dynamoDbClient.update(updateItemInput).promise();
};
