from typing import Dict


class VehicleId:
    @classmethod
    def create(cls, row: Dict):
        return f"{row.get('vehicleNumber1')}-{row.get('vehicleNumber2')}-{row.get('vehicleNumber3')}-{row.get('vehicleNumber4')}"

