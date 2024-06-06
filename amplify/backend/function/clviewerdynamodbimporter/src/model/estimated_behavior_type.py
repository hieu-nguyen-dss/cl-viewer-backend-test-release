from typing import Dict


class EstimatedBehaviorType:
    TYPES = {
      "0": "stop",
      "1": "excavation",
      "2": "change of direction",
      "3": "forward",
      "4": "carrying",
      "5": "other",
      "99": "not detected"
    }

    @classmethod
    def get_all(cls) -> Dict[str, str]:
        return cls.TYPES

    @classmethod
    def get_type(cls, behavior_id: str) -> str:
        return cls.TYPES.get(behavior_id, "other")

