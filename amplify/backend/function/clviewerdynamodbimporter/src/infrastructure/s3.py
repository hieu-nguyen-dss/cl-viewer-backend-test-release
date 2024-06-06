import boto3


class S3Infrastructure:
    @classmethod
    def client(cls) -> object:
        return boto3.resource("s3")
