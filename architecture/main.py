from diagrams import Diagram, Cluster, Edge
from diagrams.aws.compute import Lambda
from diagrams.aws.storage import S3
from diagrams.aws.database import Dynamodb
from diagrams.generic.blank import Blank
from diagrams.generic.storage import Storage
from diagrams.programming.flowchart import Database



with Diagram('architecture/image', show=False):
    with Cluster('Pioneer Corp.'):
        blank1 = Blank()
        blank2 = Blank()

    with Cluster('Landlog API'):
        ll_file_storage = Storage("Fie storage")
        ll_datastore = Database("Pub/Sub datastore")
        blank1 >> ll_file_storage
        blank2 >> ll_datastore

    with Cluster('AWS'):
        s3 = S3("S3\nclviewerfiles")
        raw_data_table = Dynamodb("DynamoDB\n(clviewerrawdata)")
        user_data_table = Dynamodb("DynamoDB\n(clvieweruserdata)")
        ll_file_storage \
            >> Edge(label="At 06:05 JST\nevery day") \
            >> Lambda("Lambda\n(S3SensingImporter)") \
            >> s3 \
            >> Edge(label="S3 put triggered") \
            >> Lambda("Lambda\n(DynamoDBSensingImporter)") \
            >> [raw_data_table, user_data_table]
        ll_datastore \
            >> Edge(label="At 06:05 JST\nevery day") \
            >> Lambda("Lambda\n(DynamoDBAlertImporter)") \
            >> raw_data_table
