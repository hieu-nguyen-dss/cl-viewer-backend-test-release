from decimal import Decimal
from model.dynamodb.raw_data_record import RawDataRecord
from model.alert_type import AlertType
from model.machine_id import MachineId
from model.vehicle_id import VehicleId
from util.dt import DynamoDBDateJST
import json


class RawDataRecordFactory:
    @classmethod
    def create_alert(cls, item: dict) -> RawDataRecord:
        row = json.loads(json.dumps(item), parse_float=Decimal)
        vehicle_id = VehicleId.create(row=row)
        machine_id = MachineId.create(vehicle_id=vehicle_id)
        unixtime = row.get('alertOccurenceDatetime')
        return RawDataRecord(
            pk=f"MACHINE#{machine_id}",
            sk=f"ALERT#{unixtime}",
            accelerationX=row.get('accelX'),
            accelerationY=row.get('accelY'),
            accelerationZ=row.get('accelZ'),
            alertId=row.get('alertType'),
            alertType=AlertType.get_type(row.get('alertType')),
            corporationId=row.get('companyId'),
            dateJst=DynamoDBDateJST.format(unixtime=unixtime),
            latitude=row.get('lat'),
            longitude=row.get('lon'),
            machineId=machine_id,
            speed=row.get('speed'),
            type='alert',
            unixtime=unixtime,
            vehicleId=vehicle_id
        )
