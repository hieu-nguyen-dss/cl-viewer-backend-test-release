from dataclasses import dataclass


@dataclass
class BucketNode:
    id: str
    gzipFilename: str
    csvFilename: str
    corporationId: str
    dateJst: str
