# "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved"

import boto3
import csv
import json
from datetime import datetime, timedelta
from botocore.exceptions import ClientError

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,POST'
}

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
s3_bucket_name = 'cleaning-senpai-logs-st'
s3_file_key = 'completed_complaints_logs.csv'
dynamodb_table = dynamodb.Table('Report')

def lambda_handler(event, context):
    try:
        body = json.loads(event['body'])
        print(body)
        report_id = body.get('Report_ID')
        report_status = body.get('Report_Status')
        supervisor_email = body.get('Supervisor_Email')

        update_report_status(report_id, report_status)

        report_data = get_report_by_id(report_id)
        if not report_data:
            return {
                'statusCode': 404,
                'headers': CORS_HEADERS,
                'body': json.dumps({"message": "Report not found."})
            }

        record = prepare_record_for_csv(report_data,supervisor_email)
        print(record)

        update_csv_in_s3(record)

        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({"message": "The report status was updated and the report was saved to S3."})
        }

    except ClientError as e:
        print(e.response['Error']['Message'])
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({"message": "Internal server error"})
        }

def update_report_status(report_id, report_status):
    now_utc = datetime.utcnow()
    ist_now = now_utc + timedelta(hours=5, minutes=30)
    timestamp = ist_now.replace(microsecond=0).isoformat()

    response = dynamodb_table.update_item(
        Key={'Report_ID': report_id},
        UpdateExpression="set Report_status = :r, Time_of_status_update_to_in_progress = :t",
        ExpressionAttributeValues={':r': report_status, ':t': timestamp},
        ReturnValues="UPDATED_NEW"
    )
    print(response)

def get_report_by_id(report_id):
    response = dynamodb_table.get_item(Key={'Report_ID': report_id})
    return response.get('Item')

def prepare_record_for_csv(report_data,supervisor_email):
    return [
        report_data['Report_ID'],
        report_data.get('Student_email', ''),
        supervisor_email,
        report_data['Report_status'],
        report_data.get('Report_date', ''),
        report_data.get('Picture_timestamp', ''),
        report_data.get('Time_of_status_update_to_in_progress', '')
    ]

def update_csv_in_s3(record):
    try:
        s3_response = s3.get_object(Bucket=s3_bucket_name, Key=s3_file_key)
        csv_content = s3_response['Body'].read().decode('utf-8').splitlines()
        csv_reader = csv.reader(csv_content)
        csv_data = list(csv_reader)
    except s3.exceptions.NoSuchKey:
        csv_data = [['Report_ID', 'Student_Email', 'Supervisor_Email', 'Report_Status', 'Report_date','reported_Time', 'cleaned_Time']]

    csv_data.append(record)
    csv_buffer = '\n'.join([','.join(map(str, row)) for row in csv_data])

    s3.put_object(
        Bucket=s3_bucket_name,
        Key=s3_file_key,
        Body=csv_buffer,
        ContentType='text/csv'
    )