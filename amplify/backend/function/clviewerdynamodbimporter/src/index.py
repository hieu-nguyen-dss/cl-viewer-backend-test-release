from factory.event_record import EventRecordFactory
from factory.dynamodb.raw_data_record import RawDataRecordFactory, RawDataDateSummaryRecordFactory
from factory.dynamodb.user_data_record import UserDataRecordFactory
from infrastructure.dynamodb import DynamoDBInfrastructure
from infrastructure.s3 import S3Infrastructure
from model.estimated_behavior_type import EstimatedBehaviorType
from model.machine_id import MachineId
from repository.dynamodb import DynamoDBUserDataRepository, DynamoDBRawDataRepository
from repository.s3 import S3Repository
from util.dt import UnixTime
import codecs
import csv
import json
import logging
import os


class JsonFormatter(logging.Formatter):
    @classmethod
    def format(cls, record):
        return json.dumps(vars(record))


logging.basicConfig(level='INFO')
logging.getLogger().handlers[0].setFormatter(JsonFormatter())
logging.getLogger("boto3").setLevel(logging.WARNING)
logging.getLogger("botocore").setLevel(logging.WARNING)
logger = logging.getLogger(__name__)


def handler(event, context):
    logger.info(f"{event}")
    dynamodb_user_data_repository = DynamoDBUserDataRepository(
        client=DynamoDBInfrastructure.client(),
        tableName=os.getenv("STORAGE_CLVIEWERUSERDATA_NAME"))
    dynamodb_raw_data_repository = DynamoDBRawDataRepository(
        client=DynamoDBInfrastructure.client(),
        tableName=os.getenv("STORAGE_CLVIEWERRAWDATA_NAME"),)
    s3_repository = S3Repository(
        client=S3Infrastructure.client())
    for record in event.get('Records'):
        try:
            event_record = EventRecordFactory.create(record=record)
        except Exception as e:
            logger.error(f"Failed to creat event record model, error: {e}, event id: {event.get('id')}")
            continue
        try:
            obj = s3_repository.get_object(
              bucket_name=event_record.bucketName,
              object_key=event_record.objectKey).get()['Body']
        except Exception as e:
            logger.error(f"Failed to get s3 object, error: {e}, event id: {event.get('id')}")
            continue

        vehicle_ids = []
        with dynamodb_raw_data_repository.get_batch_writer() as batch:
            for row in csv.DictReader(codecs.getreader('utf-8')(obj)):
                try:
                    if event_record.type == 'sensing':
                        raw_record = RawDataRecordFactory.create_sensing(row=row)
                    else:
                        raise Exception("Invalid event record type.")
                    if raw_record.vehicleId not in vehicle_ids:
                        vehicle_ids.append(raw_record.vehicleId)
                except Exception as e:
                    logger.error(f"Failed to creat raw record model, error: {e}, row: {row}, event id: {event.get('id')}")
                    continue
                try:
                    batch.put_item(Item=raw_record.to_dict())
                except Exception as e:
                    logger.error(f"Failed to put a record into DynamoDB raw data table, error: {e}, record: {raw_record}, event id: {event.get('id')}")
                    continue

        for vehicle_id in vehicle_ids:
            machine_id = MachineId.create(vehicle_id=vehicle_id)
            earliest_unixtime = 0
            latest_unixtime = 0
            try:
                for r in dynamodb_raw_data_repository.get_earliest_raw_data(machine_id=machine_id):
                    earliest_unixtime = r.get('unixtime')
            except Exception as e:
                logger.error(f"Failed to get earliest record from DynamoDB raw data table, error: {e}, machine_id: {machine_id}, event id: {event.get('id')}")
                continue
            try:
                for r in dynamodb_raw_data_repository.get_latest_raw_data(machine_id=machine_id):
                    latest_unixtime = r.get('unixtime')
            except Exception as e:
                logger.error(f"Failed to get latest record from DynamoDB raw data table, error: {e}, machine_id: {machine_id}, event id: {event.get('id')}")
                continue
            try:
                user_record = UserDataRecordFactory.create(
                  corporation_id=event_record.corporationId,
                  vehicle_id=vehicle_id,
                  earliest_sensing_unixtime=earliest_unixtime,
                  latest_sensing_unixtime=latest_unixtime
                )
            except Exception as e:
                logger.error(f"Failed to creat user record model, error: {e}, machine_id: {machine_id}, event id: {event.get('id')}")
                continue
            try:
                dynamodb_user_data_repository.put_user_data(record=user_record)
            except Exception as e:
                logger.error(f"Failed to put a record into DynamoDB user table, error: {e}, record: {user_record}, event id: {event.get('id')}")
                continue

        u = UnixTime(date_jst=event_record.dateJst)

        for vehicle_id in vehicle_ids:
            machine_id = MachineId.create(vehicle_id=vehicle_id)
            for behavior_id, behavior_type in EstimatedBehaviorType.get_all().items():
                try:
                    count = dynamodb_raw_data_repository.count_records(machine_id=machine_id, behavior_id=behavior_id, since=u.start, until=u.end)
                except Exception as e:
                    logger.error(f"Failed to count record from DynamoDB raw data table, error: {e}, machine_id: {machine_id}, event id: {event.get('id')}")
                    continue
                try:
                    date_summary_record = RawDataDateSummaryRecordFactory.create(
                        date_jst=event_record.dateJst,
                        corporation_id=event_record.corporationId,
                        vehicle_id=vehicle_id,
                        machine_id=machine_id,
                        behavior_id=behavior_id,
                        count=count
                    )
                except Exception as e:
                    logger.error(
                      f"Failed to creat raw data date summary record model, error: {e}, machine_id: {machine_id}, event id: {event.get('id')}")
                    continue
                try:
                    dynamodb_raw_data_repository.put_raw_data_date_summary(record=date_summary_record)
                except Exception as e:
                    logger.error(f"Failed to put raw data date summary record into DynamoDB raw data table, error: {e}, machine_id: {machine_id}, event id: {event.get('id')}")
                    continue
