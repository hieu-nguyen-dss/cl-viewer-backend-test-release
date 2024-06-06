from dataclasses import dataclass
from model.ll_api.datastore_channel_object import DataStoreChannelObject
import os
import requests


@dataclass
class LLApiRepository:
    client: requests
    __API_URL = os.environ.get("LL_API_URL")
    __DATASTORE_CHANNEL_ID = os.environ.get("LL_DATASTORE_CHANNEL_ID")

    def list_objects(self, access_token: str, since: int, until: int) -> dict:
        r = self.client.get(
            url=f"{self.__API_URL}/v2/datastore/channels/{self.__DATASTORE_CHANNEL_ID}/objects",
            headers={
                "Authorization": f"Bearer {access_token}"
            },
            params={
                "ascending": "false",
                "timestamp_range": f"{since}:{until}"
            },
        )
        r.raise_for_status()
        return r.json()

    def get_object(self, access_token: str, channel_object: DataStoreChannelObject) -> dict:
        r = self.client.get(
            url=f"{self.__API_URL}/v2/datastore/channels/{self.__DATASTORE_CHANNEL_ID}/objects/{channel_object.id}",
            headers={
              "Authorization": f"Bearer {access_token}"
            }
        )
        r.raise_for_status()
        return r.json()
