import requests


class LLApiInfrastructure:
    @classmethod
    def client(cls) -> object:
        return requests
