class AlertType:
    TYPES = {
        1: "long term activity alert",
        2: "simple task alert"
    }

    @classmethod
    def get_type(cls, alert_id: int) -> str:
        return cls.TYPES.get(alert_id, "")

