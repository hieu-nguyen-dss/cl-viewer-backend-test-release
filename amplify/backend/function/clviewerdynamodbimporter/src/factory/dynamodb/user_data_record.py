from model.dynamodb.user_data_record import UserDataRecord
from model.machine_id import MachineId


class UserDataRecordFactory:
    @classmethod
    def create(
        cls,
        corporation_id: str,
        vehicle_id: str,
        earliest_sensing_unixtime: int,
        latest_sensing_unixtime: int
    ) -> UserDataRecord:
        machine_id = MachineId.create(vehicle_id=vehicle_id)
        return UserDataRecord(
            pk=f"CORPORATION#{corporation_id}",
            sk=f"MACHINE#{machine_id}",
            corporationId=corporation_id,
            earliestSensingUnixtime=earliest_sensing_unixtime,
            latestSensingUnixtime=latest_sensing_unixtime,
            machineId=f"{machine_id}",
            vehicleId=vehicle_id
        )

