import { AmplifyDDBResourceTemplate } from '@aws-amplify/cli-extensibility-helper';

export function override(resources: AmplifyDDBResourceTemplate) {
  resources.dynamoDBTable.billingMode = 'PAY_PER_REQUEST';

  delete resources.dynamoDBTable.provisionedThroughput;

  // FIXME remove any and handle in typesafe way.
  (resources.dynamoDBTable.globalSecondaryIndexes as Array<any>).forEach((gsi) => {
    delete gsi.provisionedThroughput;
  });
}
