from datetime import datetime, timedelta
from pandas import Timestamp
import pytz


class UnixTimeNano:
    def __init__(self, time_utc: str):
        utc_15 = datetime.strptime(time_utc, '%Y-%m-%dT%H:%M:%SZ').replace(minute=0, second=0)
        utc_39 = utc_15 + timedelta(hours=24)
        self.since = Timestamp(utc_15).value
        self.until = Timestamp(utc_39).value


class DynamoDBDateJST:
    @classmethod
    def format(cls, unixtime: int):
        jst_00 = pytz.timezone("Asia/Tokyo").localize(datetime.fromtimestamp(unixtime))
        return format(jst_00, '%Y-%m-%d')
