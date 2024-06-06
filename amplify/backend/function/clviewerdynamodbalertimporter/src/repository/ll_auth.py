from dataclasses import dataclass
import os
import requests


@dataclass
class LLAuthRepository:
    client: requests
    __API_URL = os.environ.get("LL_AUTH_URL")
    __CLIENT_ID = os.environ.get("LL_CLIENT_ID_BACKEND")
    __CLIENT_SECRET = os.environ.get("LL_CLIENT_SECRET_BACKEND")

    def get_token(self) -> dict:
        r = self.client.post(
            url=f"{self.__API_URL}/connect/token",
            headers={
                "Content-Type": "application/x-www-form-urlencoded"
            },
            params={
                "grant_type": "client_credentials",
                "client_id": f"{self.__CLIENT_ID}",
                "client_secret": f"{self.__CLIENT_SECRET}",
                "scope": "datastore.read datastore.download"
            },
        )
        r.raise_for_status()
        return r.json()

