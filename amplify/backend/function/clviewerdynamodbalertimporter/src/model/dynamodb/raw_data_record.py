from dataclasses import dataclass


@dataclass
class RawDataRecord:
    pk: str
    sk: str
    accelerationX: float
    accelerationY: float
    accelerationZ: float
    alertId: int
    alertType: str
    corporationId: str
    dateJst: str
    latitude: float
    longitude: float
    machineId: str
    speed: int
    type: str
    unixtime: int
    vehicleId: str

    def to_dict(self):
        return self.__dict__
