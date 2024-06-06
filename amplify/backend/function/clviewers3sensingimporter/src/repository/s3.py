from dataclasses import dataclass
from model.ll_api.bucket_node import BucketNode
import os


@dataclass
class S3Repository:
    client: object

    def put_object(self, node: BucketNode, d_uid: str) -> None:
        bucket = self.client.Bucket(os.getenv("STORAGE_CLVIEWERFILES_BUCKETNAME"))
        bucket.upload_file(
            Filename=self.file_path(node=node, d_uid=d_uid),
            Key=self.object_prefix(node=node, d_uid=d_uid)
        )

    @staticmethod
    def file_path(node: BucketNode, d_uid: str) -> str:
        return f"/tmp/{node.dateJst}-{node.corporationId}-{d_uid}.csv"

    @staticmethod
    def object_prefix(node: BucketNode, d_uid: str) -> str:
        return f"private/ap-northeast-1/sensing/dt={node.dateJst}/{node.corporationId}/{d_uid}/sensing.csv"
