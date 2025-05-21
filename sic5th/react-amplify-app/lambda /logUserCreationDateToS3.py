# "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved"

import boto3
import csv
from datetime import datetime, timedelta
import io

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3', region_name='ap-south-1')

USER_TABLE = 'User'
S3_BUCKET_NAME = 'cleaning-senpai-logs-st'
def lambda_handler(event, context):
    utc_now = datetime.utcnow()
    ist_now = utc_now + timedelta(hours=5, minutes=30)
    yesterday = (ist_now - timedelta(days=1)).strftime("%Y%m%d")

    table = dynamodb.Table(USER_TABLE)
    response = table.scan(
        FilterExpression="Date_of_creation = :yesterday",
        ExpressionAttributeValues={":yesterday": yesterday}
    )
    print(response)
    
    new_user_count = len(response['Items'])
    new_data = [[yesterday, new_user_count]]
    print(new_data)

    file_name = f"new_users_count.csv"
    try:
        s3_object = s3.get_object(Bucket=S3_BUCKET_NAME, Key=file_name)
        existing_csv_data = s3_object['Body'].read().decode('utf-8').splitlines()

        csv_reader = csv.reader(existing_csv_data)
        rows = list(csv_reader)
        rows.extend(new_data)

        output = io.StringIO()
        csv_writer = csv.writer(output)
        csv_writer.writerows(rows)

        s3.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=file_name,
            Body=output.getvalue(),
            ContentType="text/csv"
        )

        return {
            "statusCode": 200,
            "body": f"CSV updated with new user count for {yesterday}."
        }

    except s3.exceptions.NoSuchKey:
        output = io.StringIO()
        csv_writer = csv.writer(output)
        csv_writer.writerow(["Date", "New Users Created"])
        csv_writer.writerows(new_data)

        s3.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=file_name,
            Body=output.getvalue(),
            ContentType="text/csv"
        )

        return {
            "statusCode": 200,
            "body": f"New CSV file created with user count for {yesterday}."
        }