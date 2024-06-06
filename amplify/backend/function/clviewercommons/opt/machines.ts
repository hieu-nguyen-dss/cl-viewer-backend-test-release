import AWS from 'aws-sdk';
import { CorporationMachine } from './types/clviewer/corporationMachine';
import { SiteMachine } from './types/clviewer/siteMachine';

const STORAGE_CLVIEWERUSERDATA_NAME = process.env.STORAGE_CLVIEWERUSERDATA_NAME;
const STORAGE_CLVIEWERRAWDATA_NAME = process.env.STORAGE_CLVIEWERRAWDATA_NAME;

const dynamoDbClient = new AWS.DynamoDB.DocumentClient();

export const getSitesDataForCorporation = async (corporationId: string) => {
  const queryInput = {
    TableName: STORAGE_CLVIEWERUSERDATA_NAME,
    ScanIndexForward: true,
    ConsistentRead: false,
    KeyConditionExpression: '#pk = :pk And begins_with(#sk, :sk)',
    ExpressionAttributeNames: {
      '#pk': 'pk',
      '#sk': 'sk',
    },
    ExpressionAttributeValues: {
      ':pk': `CORPORATION#${corporationId}`,
      ':sk': 'SITE#',
    },
  };
  return (await dynamoDbClient.query(queryInput).promise()).Items;
};

export const getMachinesForCorporation = async (corporationId: string) => {
  const queryInput = {
    TableName: STORAGE_CLVIEWERUSERDATA_NAME,
    ScanIndexForward: true,
    ConsistentRead: false,
    KeyConditionExpression: '#pk = :pk And begins_with(#sk, :sk)',
    ExpressionAttributeValues: {
      ':pk': `CORPORATION#${corporationId}`,
      ':sk': 'MACHINE#',
    },
    ExpressionAttributeNames: {
      '#pk': 'pk',
      '#sk': 'sk',
    },
  };
  return (await dynamoDbClient.query(queryInput).promise()).Items as CorporationMachine[];
};

export const getMachinesForSite = async (corporationId: string, siteId: string) => {
  const queryInput = {
    TableName: STORAGE_CLVIEWERUSERDATA_NAME,
    ScanIndexForward: true,
    ConsistentRead: false,
    KeyConditionExpression: '#pk = :pk And begins_with(#sk, :sk)',
    ExpressionAttributeValues: {
      ':pk': `CORPORATION#${corporationId}`,
      ':sk': `SITEMACHINE#${siteId}#`,
    },
    ExpressionAttributeNames: {
      '#pk': 'pk',
      '#sk': 'sk',
    },
  };
  return (await dynamoDbClient.query(queryInput).promise()).Items as SiteMachine[];
};

export const getMachinesLinksForSite = async (corporationId: string, siteId: string, startDateJst: string, endDateJst: string) => {
  const queryInput = {
    TableName: STORAGE_CLVIEWERUSERDATA_NAME,
    ScanIndexForward: true,
    ConsistentRead: false,

    KeyConditionExpression: '#pk = :pk And begins_with(#sk, :sk)',
    FilterExpression: '(#startDateJst <= :startDateJst And #endDateJst >= :startDateJst) Or (#endDateJst >= :endDateJst AND #startDateJst <= :endDateJst)',
    ExpressionAttributeValues: {
      ':pk': `CORPORATION#${corporationId}`,
      ':sk': `SITEMACHINE#${siteId}#`,
      ':startDateJst': startDateJst,
      ':endDateJst': endDateJst,
    },
    ExpressionAttributeNames: {
      '#pk': 'pk',
      '#sk': 'sk',
      '#startDateJst': 'startDateJst',
      '#endDateJst': 'endDateJst',
    },
  };
  return (await dynamoDbClient.query(queryInput).promise()).Items as SiteMachine[];
};

export const getMachinesLinksForSiteMachine = async (corporationId: string, siteId: string, machineId: string, startDateJst: string, endDateJst: string) => {
  const queryInput = {
    TableName: STORAGE_CLVIEWERUSERDATA_NAME,
    ScanIndexForward: true,
    ConsistentRead: false,

    KeyConditionExpression: '#pk = :pk And begins_with(#sk, :sk)',
    FilterExpression: '(#startDateJst <= :startDateJst And #endDateJst >= :startDateJst) Or (#endDateJst >= :endDateJst AND #startDateJst <= :endDateJst)',
    ExpressionAttributeValues: {
      ':pk': `CORPORATION#${corporationId}`,
      ':sk': `SITEMACHINE#${siteId}#${machineId}#`,
      ':startDateJst': startDateJst,
      ':endDateJst': endDateJst,
    },
    ExpressionAttributeNames: {
      '#pk': 'pk',
      '#sk': 'sk',
      '#startDateJst': 'startDateJst',
      '#endDateJst': 'endDateJst',
    },
  };
  return (await dynamoDbClient.query(queryInput).promise()).Items as SiteMachine[];
};

export const getSiteMachinesForCorporation = async (corporationId: string) => {
  const queryInput = {
    TableName: STORAGE_CLVIEWERUSERDATA_NAME,
    ScanIndexForward: true,
    ConsistentRead: false,
    KeyConditionExpression: '#pk = :pk And begins_with(#sk, :sk)',
    ExpressionAttributeValues: {
      ':pk': `CORPORATION#${corporationId}`,
      ':sk': 'SITEMACHINE#',
    },
    ExpressionAttributeNames: {
      '#pk': 'pk',
      '#sk': 'sk',
    },
  };
  return (await dynamoDbClient.query(queryInput).promise()).Items as SiteMachine[];
};

export const createSiteMachinesPeriodForCorporation = async (
  corporationId: string,
  siteId: string,
  machineId: string,
  startDateJst: string,
  endDateJst: string,
  machineName: string,
  machineType: string,
  machineColorCode?: string
) => {
  const putItemInput = {
    TableName: STORAGE_CLVIEWERUSERDATA_NAME,
    Item: {
      pk: `CORPORATION#${corporationId}`,
      sk: `SITEMACHINE#${siteId}#${machineId}#${startDateJst}#${endDateJst}`,
      corporationId,
      siteId,
      machineId,
      startDateJst,
      endDateJst,
      machineName,
      machineType,
      machineColorCode,
    },
  };

  await dynamoDbClient.put(putItemInput).promise();
};

export const getSiteMachineBySk = async (corporationId: string, sk: string) => {
  const getItemInput = {
    TableName: STORAGE_CLVIEWERUSERDATA_NAME,
    Key: {
      pk: `CORPORATION#${corporationId}`,
      sk,
    },
  };

  return (await dynamoDbClient.get(getItemInput).promise()).Item as SiteMachine;
};

interface UpdateVehicleDTO {
  name?: string;
  color?: string;
  type?: string;
}

export const updateSiteMachineBySk = async (corporationId: string, sk: string, details: UpdateVehicleDTO) => {
  if (!details.name && !details.color && !details.type) return;

  const updateExpressionValues = [];
  if (details.name) updateExpressionValues.push('machineName = :machineName');
  if (details.color) updateExpressionValues.push('machineColorCode = :machineColorCode');
  if (details.type) updateExpressionValues.push('machineType = :machineType');

  const updateAttributeValues = {};
  if (details.name) updateAttributeValues[':machineName'] = details.name;
  if (details.color) updateAttributeValues[':machineColorCode'] = details.color;
  if (details.type) updateAttributeValues[':machineType'] = details.type;

  const updateItemInput = {
    TableName: STORAGE_CLVIEWERUSERDATA_NAME,
    Key: {
      pk: `CORPORATION#${corporationId}`,
      sk,
    },
    UpdateExpression: `SET ${updateExpressionValues.join(', ')}`,
    ExpressionAttributeValues: updateAttributeValues,
  };

  await dynamoDbClient.update(updateItemInput).promise();
};

export const deleteSiteMachineBySk = async (corporationId: string, sk: string) => {
  const deleteItemInput = {
    TableName: STORAGE_CLVIEWERUSERDATA_NAME,
    Key: {
      pk: `CORPORATION#${corporationId}`,
      sk,
    },
  };

  await dynamoDbClient.delete(deleteItemInput).promise();
};

export const getAlertForCorporation = async (corporationId: string) => {
  const queryInput = {
    TableName: STORAGE_CLVIEWERRAWDATA_NAME,
    ScanIndexForward: false,
    ConsistentRead: false,
    IndexName: 'corporationId-sk-index',
    KeyConditionExpression: '#pk = :pk And begins_with(#sk, :sk)',
    ExpressionAttributeValues: {
      ':pk': corporationId,
      ':sk': 'ALERT#',
    },
    ExpressionAttributeNames: {
      '#pk': 'corporationId',
      '#sk': 'sk',
    },
  };
  return (await dynamoDbClient.query(queryInput).promise()).Items;
};

export const getSensingForMachine = async (machineId: string, startTime: number, endTime: number, Limit?: number) => {
  var items = []
  let exclusiveStartKey = null;
  while(true) {
    const queryInput: AWS.DynamoDB.DocumentClient.QueryInput = {
      TableName: STORAGE_CLVIEWERRAWDATA_NAME,
      ScanIndexForward: true,
      ConsistentRead: false,
      KeyConditionExpression: '#pk = :pk And #sk between :sk1 and :sk2',
      ProjectionExpression: 'unixtime,latitude,estimatedBehaviorId,longitude',
      ExpressionAttributeValues: {
        ':pk': `MACHINE#${machineId}`,
        ':sk1': `SENSING#${startTime}`,
        ':sk2': `SENSING#${endTime}`,
      },
      ExpressionAttributeNames: {
        '#pk': 'pk',
        '#sk': 'sk',
      },
      Limit,
    };
    if (exclusiveStartKey) queryInput.ExclusiveStartKey = exclusiveStartKey
    const result = (await dynamoDbClient.query(queryInput).promise());
    items.push(result.Items)
    if (!result.LastEvaluatedKey) break;
    exclusiveStartKey = result.LastEvaluatedKey;
  }
  return items
};

export const getAlertForMachine = async (machineId: string) => {
  const queryInput = {
    TableName: STORAGE_CLVIEWERRAWDATA_NAME,
    ScanIndexForward: false,
    ConsistentRead: false,
    KeyConditionExpression: '#pk = :pk',
    ExpressionAttributeValues: {
      ':pk': `MACHINE#${machineId}`,
    },
    ExpressionAttributeNames: {
      '#pk': 'pk',
    },
  };
  return (await dynamoDbClient.query(queryInput).promise()).Items;
};

export const countMachineSensingBetweenTimes = async (machineId: string, startTime: number, endTime: number) => {
  var sum = 0;
  let exclusiveStartKey = null;
  while(true) {
    const queryInput: AWS.DynamoDB.DocumentClient.QueryInput = {
      TableName: STORAGE_CLVIEWERRAWDATA_NAME,
      Select: 'COUNT',
      KeyConditionExpression: '#pk = :pk And #sk between :sk1 and :sk2',
      ExpressionAttributeValues: {
        ':pk': `MACHINE#${machineId}`,
        ':sk1': `SENSING#${startTime}`,
        ':sk2': `SENSING#${endTime}`,
      },
      ExpressionAttributeNames: {
        '#pk': 'pk',
        '#sk': 'sk',
      },
    };
    if (exclusiveStartKey) queryInput.ExclusiveStartKey = exclusiveStartKey
    const result = (await dynamoDbClient.query(queryInput).promise());
    sum += result.Count
    if (!result.LastEvaluatedKey) break;
    exclusiveStartKey = result.LastEvaluatedKey;
  }
  return sum
};

export const countMachineBehaviorBetweenTimes = async (machineId: string, behaviourId: number, startTime: number, endTime: number) => {
  var sum = 0;
  let exclusiveStartKey = null;
  while(true) {
    const queryInput: AWS.DynamoDB.DocumentClient.QueryInput = {
      TableName: STORAGE_CLVIEWERRAWDATA_NAME,
      IndexName: 'machineIdEstimatedBehaviorId-sk-index',
      Select: 'COUNT',
      KeyConditionExpression: '#pk = :pk And #sk between :sk1 and :sk2',
      ExpressionAttributeValues: {
        ':pk': `${machineId}#${behaviourId}`,
        ':sk1': `SENSING#${startTime}`,
        ':sk2': `SENSING#${endTime}`,
      },
      ExpressionAttributeNames: {
        '#pk': 'machineIdEstimatedBehaviorId',
        '#sk': 'sk',
      },
    };
    if (exclusiveStartKey) queryInput.ExclusiveStartKey = exclusiveStartKey
    const result = (await dynamoDbClient.query(queryInput).promise());
    sum += result.Count
    if (!result.LastEvaluatedKey) break;
    exclusiveStartKey = result.LastEvaluatedKey;
  }
  return sum
};

export const updateMachineDetails = async (pkValue: string, skValue: string, details: UpdateVehicleDTO) => {
  if (!details.name && !details.color && !details.type) return;

  const updateExpressionValues = [];
  if (details.name) updateExpressionValues.push('machineName = :machineName');
  if (details.color) updateExpressionValues.push('machineColorCode = :machineColorCode');
  if (details.type) updateExpressionValues.push('machineType = :machineType');

  const updateAttributeValues = {};
  if (details.name) updateAttributeValues[':machineName'] = details.name;
  if (details.color) updateAttributeValues[':machineColorCode'] = details.color;
  if (details.type) updateAttributeValues[':machineType'] = details.type;

  const updateItemInput = {
    TableName: STORAGE_CLVIEWERUSERDATA_NAME,
    Key: {
      pk: pkValue,
      sk: skValue,
    },
    UpdateExpression: `SET ${updateExpressionValues.join(', ')}`,
    ExpressionAttributeValues: updateAttributeValues,
  };

  await dynamoDbClient.update(updateItemInput).promise();
};

export const getCorporationSite = async (corporationId: string, siteId: string) => {
  const getItemInput = {
    TableName: STORAGE_CLVIEWERUSERDATA_NAME,
    Key: {
      pk: `CORPORATION#${corporationId}`,
      sk: `SITE#${siteId}`,
    },
  };

  return (await dynamoDbClient.get(getItemInput).promise()).Item;
};

export const createCorporationSite = async (corporationId: string, siteId: string, startTimeJst: string, endTimeJst: string) => {
  const putItemInput = {
    TableName: STORAGE_CLVIEWERUSERDATA_NAME,
    Item: {
      pk: `CORPORATION#${corporationId}`,
      sk: `SITE#${siteId}`,
      corporationId,
      siteId,
      startTimeJst,
      endTimeJst,
    },
  };

  await dynamoDbClient.put(putItemInput).promise();
};

export const updateCorporationSite = async (corporationId: string, siteId: string, details: any) => {
  const updateExpressionValues = [];
  if (details?.startTimeJst) updateExpressionValues.push('startTimeJst = :startTimeJst');
  if (details?.endTimeJst) updateExpressionValues.push('endTimeJst = :endTimeJst');

  const updateAttributeValues = {};
  if (details?.startTimeJst) updateAttributeValues[':startTimeJst'] = details?.startTimeJst;
  if (details?.endTimeJst) updateAttributeValues[':endTimeJst'] = details?.endTimeJst;

  const updateItemInput = {
    TableName: STORAGE_CLVIEWERUSERDATA_NAME,
    Key: {
      pk: `CORPORATION#${corporationId}`,
      sk: `SITE#${siteId}`,
    },
    UpdateExpression: `SET ${updateExpressionValues.join(', ')}`,
    ExpressionAttributeValues: updateAttributeValues,
  };

  await dynamoDbClient.update(updateItemInput).promise();
};

export const getCorporationMachine = async (corporationId: string, machineId: string) => {
  const getItemInput = {
    TableName: STORAGE_CLVIEWERUSERDATA_NAME,
    Key: {
      pk: `CORPORATION#${corporationId}`,
      sk: `MACHINE#${machineId}`,
    },
  };

  return (await dynamoDbClient.get(getItemInput).promise()).Item as CorporationMachine;
};
