from model.ll_api.bucket_node import BucketNode


class BucketNodesFactory:
    @classmethod
    def create_all(cls, response: dict) -> [BucketNode]:
        return [BucketNode(
            id=node.get("id"),
            gzipFilename=node.get("name"),
            csvFilename=cls.get_csv_filename(node.get("name")),
            corporationId=cls.get_corporation_id(node.get("name")),
            dateJst=cls.get_date_jst(node.get("name"))
        ) for node in response.get("nodes")]

    @staticmethod
    def get_csv_filename(gzip_filename: str) -> str:
        return f"{gzip_filename.strip('.gz')}"

    @staticmethod
    def get_corporation_id(gzip_filename: str) -> str:
        return gzip_filename.split("_")[2]

    @staticmethod
    def get_date_jst(gzip_filename: str) -> str:
        return gzip_filename.split("_")[3].strip(".csv.gz")
