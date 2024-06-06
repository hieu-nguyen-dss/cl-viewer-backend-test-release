import requests


class LLAuthInfrastructure:
    @classmethod
    def client(cls) -> requests:
        return requests
