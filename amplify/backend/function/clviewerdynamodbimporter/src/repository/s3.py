from dataclasses import dataclass


@dataclass
class S3Repository:
    client: object

    def get_object(self, bucket_name: str, object_key: str) -> object:
        return self.client.Object(
            bucket_name=bucket_name,
            key=object_key
        )
