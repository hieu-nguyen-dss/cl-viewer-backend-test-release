from dataclasses import dataclass


@dataclass
class EventRecord:
    bucketName: str
    corporationId: str
    dateJst: str
    objectKey: str
    type: str

