from boto3.dynamodb.conditions import Key
from dataclasses import dataclass
from model.dynamodb.user_data_record import UserDataRecord
from model.dynamodb.raw_data_record import RawDataDateSummaryRecord


@dataclass
class DynamoDBUserDataRepository:
    client: object
    tableName: str

    def put_user_data(self, record: UserDataRecord) -> None:
        table = self.client.Table(self.tableName)
        table.put_item(Item=record.to_dict())


@dataclass
class DynamoDBRawDataRepository:
    client: object
    tableName: str

    def get_earliest_raw_data(self, machine_id: str) -> list:
        table = self.client.Table(self.tableName)
        resp = table.query(
          KeyConditionExpression=Key("pk").eq(f"MACHINE#{machine_id}") & Key("sk").begins_with("SENSING"),
          ScanIndexForward=True,
          Limit=1
        )
        return resp.get("Items", [])

    def get_latest_raw_data(self, machine_id: str) -> list:
        table = self.client.Table(self.tableName)
        resp = table.query(
          KeyConditionExpression=Key("pk").eq(f"MACHINE#{machine_id}") & Key("sk").begins_with("SENSING"),
          ScanIndexForward=False,
          Limit=1
        )
        return resp.get("Items", [])

    def get_batch_writer(self) -> object:
        table = self.client.Table(self.tableName)
        return table.batch_writer()

    def count_records(self, machine_id: str, behavior_id: str, since: int, until: int) -> int:
        table = self.client.Table(self.tableName)
        resp = table.query(
          IndexName="machineIdEstimatedBehaviorId-sk-index",
          KeyConditionExpression=Key("machineIdEstimatedBehaviorId").eq(f"{machine_id}#{behavior_id}") & Key("sk").between(f"SENSING#{since}", f"SENSING#{until}"),
          Select='COUNT'
        )
        return resp.get("Count", [])

    def put_raw_data_date_summary(self, record: RawDataDateSummaryRecord) -> None:
        table = self.client.Table(self.tableName)
        table.put_item(Item=record.to_dict())
