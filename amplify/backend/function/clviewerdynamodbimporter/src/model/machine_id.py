import uuid


class MachineId:
    @classmethod
    def create(cls, vehicle_id: str) -> str :
        return f"{uuid.uuid5(uuid.NAMESPACE_DNS, vehicle_id)}"

