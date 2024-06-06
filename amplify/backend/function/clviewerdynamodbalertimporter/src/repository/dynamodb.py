from dataclasses import dataclass
from model.dynamodb.raw_data_record import RawDataRecord


@dataclass
class DynamoDBRawDataRepository:
    client: object
    tableName: str

    def put_raw_data(self, record: RawDataRecord) -> None:
        table = self.client.Table(self.tableName)
        table.put_item(Item=record.to_dict())
