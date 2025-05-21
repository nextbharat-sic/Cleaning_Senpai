# "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved"

import json
import boto3
import datetime
import csv
from io import StringIO
from boto3.dynamodb.types import TypeDeserializer
from decimal import Decimal
import io

dynamodb = boto3.client('dynamodb', region_name='ap-south-1')
s3 = boto3.client('s3')
deserializer = TypeDeserializer()

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def log_request_to_s3(event):
    try:
        print(event)
        utc_now = datetime.datetime.utcnow()
        ist_now = utc_now + datetime.timedelta(hours=5, minutes=30)
        
        timestamp = ist_now.isoformat()
        useremail = event['queryStringParameters']['useremail']
        origin = event['headers']['origin']
        
        log_data = [[timestamp, useremail, origin]]
        print(log_data)

        log_bucket = 'cleaning-senpai-active-user-access-logs-st'
        file_name = f"access_log_{ist_now.strftime('%Y-%m-%d')}.csv"
        try:
            s3_object = s3.get_object(Bucket=log_bucket, Key=file_name)
            existing_csv_data = s3_object['Body'].read().decode('utf-8').splitlines()

            csv_reader = csv.reader(existing_csv_data)
            rows = list(csv_reader)
            rows.extend(log_data)

            output = io.StringIO()
            csv_writer = csv.writer(output)
            csv_writer.writerows(rows)

            s3.put_object(
                Bucket=log_bucket,
                Key=file_name,
                Body=output.getvalue(),
                ContentType="text/csv"
            )
            
            print("Log saved successfully")
        except s3.exceptions.NoSuchKey:
            output = io.StringIO()
            csv_writer = csv.writer(output)
            csv_writer.writerow(["Timestamp", "User Email", "Origin"])
            csv_writer.writerows(log_data)

            s3.put_object(
                Bucket=log_bucket,
                Key=file_name,
                Body=output.getvalue(),
                ContentType="text/csv"
            )
            print("Today's first Log saved successfully")
    except Exception as e:
        print(f"Error in saving log: {e}")

def lambda_handler(event, context):
    try:
        log_request_to_s3(event)
        
        print(event)
        items = []
        scan_kwargs = {
            'TableName': 'Report'
        }
        while True:
            response = dynamodb.scan(**scan_kwargs)
            items.extend([
                {key: deserializer.deserialize(value) for key, value in item.items()}
                for item in response['Items']
            ])
            # If the response does not contain a LastEvaluatedKey, all items have been retrieved.
            if 'LastEvaluatedKey' not in response:
                break
            scan_kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']
        
        return {
            'statusCode': 200,
            'body': json.dumps(items, cls=DecimalEncoder),
            'headers': {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        }
    
    except Exception as e:
        print('Error:', str(e))
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'Failed to fetch data', 'error': str(e)}),
        }