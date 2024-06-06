from datetime import datetime, timedelta
from infrastructure.ll_api import LLApiInfrastructure
from infrastructure.ll_auth import LLAuthInfrastructure
from infrastructure.s3 import S3Infrastructure
from factory.ll_api.bucket_node import BucketNodesFactory
from repository.ll_api import LLApiRepository
from repository.ll_auth import LLAuthRepository
from repository.s3 import S3Repository
from requests import HTTPError
from pytz import timezone
import glob
import gzip
import json
import logging
import os
import pandas as pd
import shutil


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
    s3_repository = S3Repository(client=S3Infrastructure.client())

    try:
        token = ll_auth_repository.get_token()
    except HTTPError as _:
        # Don't output error here because client id & client secret would be included.
        logger.error(f"Failed to get landlog auth token, event id: {event.get('id')}")
        return
    try:
        objects = ll_api_repository.get_bucket_nodes(
          access_token=token.get("access_token"),
          target_date_jst=get_target_date_jst(event=event))
    except HTTPError as e:
        logger.error(f"Failed to get object from landlog file storage, error: {e}, event id: {event.get('id')}")
        return
    try:
        bucket_nodes = BucketNodesFactory.create_all(response=objects)
    except Exception as e:
        logger.error(f"Failed to create bucket nodes model from landlog API response, error: {e}, event id: {event.get('id')}")
        return

    logger.info(f"bucket_nodes: {bucket_nodes} ")
    for node in bucket_nodes:
        for p in glob.glob("/tmp/*"):
            if os.path.isfile(p):
                os.remove(p)
        try:
            ll_api_repository.download_bucket_node(access_token=token.get("access_token"), node=node)
        except Exception as e:
            logger.error(f"Failed to download bucket node from landlog file storage, error: {e}, node: {node}, event id: {event.get('id')}")
            continue
        with gzip.open(f"/tmp/{node.gzipFilename}", mode="rb") as gzip_file:
            with open(f"/tmp/{node.csvFilename}", mode="wb") as decompressed_file:
                try:
                    shutil.copyfileobj(gzip_file, decompressed_file)
                except Exception as e:
                    logger.error(f"Failed to decompress gzip, error: {e}, node: {node}, event id: {event.get('id')}")
                    continue
            try:
                df = pd.read_csv(f"/tmp/{node.csvFilename}", index_col=0)
                d_uids = df.groupby('deviceUniqueId')
                for d_uid, sub_df in d_uids:
                    sub_df.to_csv(f"/tmp/{node.dateJst}-{node.corporationId}-{d_uid}.csv")
            except Exception as e:
                logger.error(f"Failed to split csv file by device unique id, error: {e}, node: {node}, event id: {event.get('id')}")
                continue
            for d_uid, _ in d_uids:
                try:
                    s3_repository.put_object(node=node, d_uid=d_uid)
                except Exception as e:
                    logger.error(f"Failed to upload csv file to S3 bucket, error: {e}, node: {node}, device unique id: {d_uid}, event id: {event.get('id')}")
                    continue


def get_target_date_jst(event: dict) -> str:
    utc = datetime.strptime(event.get("time"), '%Y-%m-%dT%H:%M:%S%z')
    jst = utc.astimezone(timezone('Asia/Tokyo'))
    target_dt = jst + timedelta(days=-1)
    return target_dt.strftime('%Y%m%d')
