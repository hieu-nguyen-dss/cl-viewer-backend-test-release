from factory.dynamodb.raw_data_record import RawDataRecordFactory
from factory.ll_api.datastore_channel_object import DataStoreChannelObjectsFactory
from infrastructure.dynamodb import DynamoDBInfrastructure
from infrastructure.ll_api import LLApiInfrastructure
from infrastructure.ll_auth import LLAuthInfrastructure
from repository.dynamodb import DynamoDBRawDataRepository
from repository.ll_api import LLApiRepository
from repository.ll_auth import LLAuthRepository
from requests import HTTPError
from util.dt import UnixTimeNano
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
    ll_auth_repository = LLAuthRepository(client=LLAuthInfrastructure.client())
    ll_api_repository = LLApiRepository(client=LLApiInfrastructure.client())
    dynamodb_raw_data_repository = DynamoDBRawDataRepository(
        client=DynamoDBInfrastructure.client(),
        tableName=os.getenv("STORAGE_CLVIEWERRAWDATA_NAME"),)
    u = UnixTimeNano(time_utc=event.get('time'))

    try:
        token = ll_auth_repository.get_token()
    except HTTPError as _:
        # Don't output error here because client id & client secret would be included.
        logger.error(f"Failed to get landlog auth token, event id: {event.get('id')}")
        return
    try:
        objects = ll_api_repository.list_objects(
            access_token=token.get("access_token"),
            since=u.since,
            until=u.until)
    except HTTPError as e:
        logger.error(f"Failed to get object from landlog file storage, error: {e}, event id: {event.get('id')}")
        return
    try:
        channel_objects = DataStoreChannelObjectsFactory.create_all(response=objects)
    except Exception as e:
        logger.error(f"Failed to create datastore channel object from landlog datastore api response, error: {e}, event id: {event.get('id')}")
        return

    for channel_object in channel_objects:
        try:
            channel_objects_content = ll_api_repository.get_object(
                access_token=token.get("access_token"),
                channel_object=channel_object)
        except Exception as e:
            logger.error(f"Failed to get datastore channel object from landlog datastore api, error: {e}, event id: {event.get('id')}")
            continue
        try:
            alert = RawDataRecordFactory.create_alert(item=channel_objects_content)
        except Exception as e:
            logger.error(f"Failed to create raw data record alert model, error: {e}, event id: {event.get('id')}")
            continue
        try:
            dynamodb_raw_data_repository.put_raw_data(record=alert)
        except Exception as e:
            logger.error(f"Failed to put raw data record into DynamoDB raw data table, error: {e}, event id: {event.get('id')}")
            continue
