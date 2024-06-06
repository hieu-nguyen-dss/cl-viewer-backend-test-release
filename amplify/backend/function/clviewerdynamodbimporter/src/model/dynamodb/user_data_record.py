from dataclasses import dataclass


@dataclass
class UserDataRecord:
    pk: str
    sk: str
    corporationId: str
    earliestSensingUnixtime: int
    latestSensingUnixtime: int
    machineId: str
    vehicleId: str

    def to_dict(self):
        return self.__dict__
