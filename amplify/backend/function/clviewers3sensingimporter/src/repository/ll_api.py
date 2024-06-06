from dataclasses import dataclass
from model.ll_api.bucket_node import BucketNode
import os
import requests


@dataclass
class LLApiRepository:
    client: requests
    __API_URL = os.environ.get("LL_API_URL")
    __FILE_STORAGE_ID = os.environ.get("LL_FILE_STORAGE_ID")

    def get_bucket_nodes(self, access_token: str, target_date_jst: str) -> dict:
        r = self.client.get(
            url=f"{self.__API_URL}/v2/file_storage/buckets/{self.__FILE_STORAGE_ID}/nodes",
            headers={
                "Authorization": f"Bearer {access_token}"
            },
            params={
                "order": "desc",
                "order_by": "updated_at",
                "name": f"_{target_date_jst}.csv.gz"
            },
        )
        r.raise_for_status()
        return r.json()

    def download_bucket_node(self, access_token: str, node: BucketNode):
        r = self.client.get(
            url=f"{self.__API_URL}/v2/file_storage/buckets/{self.__FILE_STORAGE_ID}/download",
            headers={
                "Authorization": f"Bearer {access_token}"
            },
            params={
                "node_id": node.id
            },
            stream=True
        )
        r.raise_for_status()
        with open(f"/tmp/{node.gzipFilename}", 'wb') as file:
            for chunk in r:
                file.write(chunk)
