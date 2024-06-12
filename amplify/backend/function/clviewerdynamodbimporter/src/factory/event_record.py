from model.event_record import EventRecord
from urllib.parse import unquote


class EventRecordFactory:
    @classmethod
    def create(cls, record: dict) -> EventRecord:
        object_key = unquote(record.get('s3').get('object').get('key'))
        object_key_split = object_key.split('/')
        return EventRecord(
            bucketName=record.get('s3').get('bucket').get('name'),
            corporationId=object_key_split[4],
            dateJst=object_key_split[3].split('=')[1],
            objectKey=object_key,
            type=object_key_split[2]
        )

