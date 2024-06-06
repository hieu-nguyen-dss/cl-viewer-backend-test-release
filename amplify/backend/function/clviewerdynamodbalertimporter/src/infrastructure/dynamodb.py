import boto3


class DynamoDBInfrastructure:
    @classmethod
    def client(cls) -> object:
        return boto3.resource("dynamodb")
