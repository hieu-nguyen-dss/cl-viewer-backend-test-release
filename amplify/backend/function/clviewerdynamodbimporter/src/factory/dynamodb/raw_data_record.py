from model.dynamodb.raw_data_record import RawDataRecord, RawDataDateSummaryRecord
from model.estimated_behavior_type import EstimatedBehaviorType
from model.machine_id import MachineId
from model.vehicle_id import VehicleId
from util.dt import DynamoDBDateJST


class RawDataRecordFactory:
    @classmethod
    def create_sensing(cls, row: dict) -> RawDataRecord:
        vehicle_id = VehicleId.create(row=row)
        machine_id = MachineId.create(vehicle_id=vehicle_id)
        return RawDataRecord(
            pk=f"MACHINE#{machine_id}",
            sk=f"SENSING#{row.get('time')}",
            accelerationX=row.get('accelX'),
            accelerationY=row.get('accelY'),
            accelerationZ=row.get('accelZ'),
            alertId=0,
            alertType=0,
            corporationId=row.get('companyId'),
            differenceMilleSec=row.get('differenceTime'),
            direction=row.get('dir'),
            driveDistance=0,
            driveDurationSec=0,
            estimatedBehaviorId=row.get('estimatedBehavior'),
            estimatedBehaviorType=EstimatedBehaviorType.get_type(behavior_id=row.get('estimatedBehavior')),
            latitude=row.get('lat'),
            longitude=row.get('lon'),
            machineId=machine_id,
            machineIdEstimatedBehaviorId=f"{machine_id}#{row.get('estimatedBehavior')}",
            speed=row.get('speed'),
            type='sensing',
            unixtime=row.get('time'),
            unixtimeAccOff=0,
            unixtimeAccOn=0,
            vehicleId=vehicle_id
        )


class RawDataDateSummaryRecordFactory:
    @classmethod
    def create(cls, date_jst: str, corporation_id: str, vehicle_id: str, machine_id: str, behavior_id: str, count: int) -> RawDataDateSummaryRecord:
        formatted_date_jst = DynamoDBDateJST.format(date_jst=date_jst)
        return RawDataDateSummaryRecord(
            pk=f"MACHINE-DATE-SUMMARY#{machine_id}#{formatted_date_jst}",
            sk=f"BEHAVIOR#{behavior_id}",
            corporationId=corporation_id,
            dateJst=formatted_date_jst,
            estimatedBehaviorId=behavior_id,
            estimatedBehaviorType=EstimatedBehaviorType.get_type(behavior_id=behavior_id),
            estimatedTotalSeconds=count,
            machineId=machine_id,
            vehicleId=vehicle_id
        )
