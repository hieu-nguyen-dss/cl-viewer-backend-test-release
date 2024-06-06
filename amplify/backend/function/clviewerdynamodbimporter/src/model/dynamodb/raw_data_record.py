from dataclasses import dataclass


@dataclass
class RawDataRecord:
    pk: str
    sk: str
    accelerationX: float
    accelerationY: float
    accelerationZ: float
    alertId: int
    alertType: int
    corporationId: str
    differenceMilleSec: int
    direction: float
    driveDistance: int
    driveDurationSec: int
    estimatedBehaviorId: int
    estimatedBehaviorType: str
    latitude: float
    longitude: float
    machineId: str
    machineIdEstimatedBehaviorId: str
    speed: int
    type: str
    unixtime: int
    unixtimeAccOff: int
    unixtimeAccOn: int
    vehicleId: str

    def to_dict(self):
        return self.__dict__


@dataclass
class RawDataDateSummaryRecord:
    pk: str
    sk: str
    corporationId: str
    dateJst: int
    estimatedBehaviorId: str
    estimatedBehaviorType: str
    estimatedTotalSeconds: int
    machineId: str
    vehicleId: str

    def to_dict(self):
        return self.__dict__
