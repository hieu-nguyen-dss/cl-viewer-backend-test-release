from datetime import datetime, timedelta
import pytz


class UnixTime:
    def __init__(self, date_jst: str):
        jst_00 = pytz.timezone("Asia/Tokyo").localize(datetime.strptime(date_jst, '%Y%m%d'))
        jst_24 = jst_00 + timedelta(hours=24)
        self.start = int(jst_00.timestamp())
        self.end = int(jst_24.timestamp())


class DynamoDBDateJST:
    @classmethod
    def format(cls, date_jst: str):
        jst_00 = pytz.timezone("Asia/Tokyo").localize(datetime.strptime(date_jst, '%Y%m%d'))
        return format(jst_00, '%Y-%m-%d')

