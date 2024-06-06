from model.ll_api.datastore_channel_object import DataStoreChannelObject


class DataStoreChannelObjectsFactory:
    @classmethod
    def create_all(cls, response: dict) -> [DataStoreChannelObject]:
        return [DataStoreChannelObject(
            id=obj.get("id"),
            timestampNanoSecs=obj.get("timestamp")
        ) for obj in response.get("objects")]
