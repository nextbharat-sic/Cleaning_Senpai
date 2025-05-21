# "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved"

import json
import boto3
import time
from datetime import datetime, timedelta
import traceback
import base64
from decimal import Decimal, getcontext, Inexact
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Attr

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
report_table = dynamodb.Table('Report')
supervisor_table = dynamodb.Table('Supervisor')
notification_table = dynamodb.Table('Notification')
Supervisor_notification_table = dynamodb.Table('Supervisor_Notification')
Region_table = dynamodb.Table('Region')

IST_OFFSET = timedelta(hours=5, minutes=30)
datetime_utc = datetime.utcnow() + IST_OFFSET

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,POST'
}
def get_supervisor_emails(table):
    try:
        response = table.scan()
        supervisor_emails = [item['Supervisor_email'] for item in response['Items']]
        return supervisor_emails

    except ClientError as e:
        print(f"ClientError getting Supervisor emails from Region table: {e}")
        print(f"Error code: {e.response['Error']['Code']}")
        print(f"Error message: {e.response['Error']['Message']}")
    except Exception as e:
        print(f"General Error getting Supervisor emails from Region table: {e}")
        print(traceback.format_exc())
        return []

def lambda_handler(event, context):
    try:
        body = json.loads(event['body'])
        report_id = body.get('Report_ID')
        new_status = body.get('Report_status')
        client_email = body.get('Client_email')
        picture = body.get('Picture')
        pinLat = body.get('PinLat')
        pinLng = body.get('PinLng')

        region_supervisor_emails = get_supervisor_emails(Region_table)
        base64_data = picture.split(',')[1]
        image_data = base64.b64decode(base64_data)
        response_s3 = s3.put_object(
            Body=image_data,
            Bucket='devdevimage',
            Key=f'{report_id}.jpg',
            ContentType='image/jpeg'
        )

        print("res",response_s3)

        region = body.get('Region')
        print("region:",region) 
        response = supervisor_table.scan(
            FilterExpression=Attr('Regions').contains(region)
        )
        print(response)
        if 'Items' in response and len(response['Items']) > 0:
            target_supervisor_email = [item.get('Supervisor_email') for item in response['Items']]
            print('supervisor_email:',target_supervisor_email)
        else:
            target_supervisor_email = ['shunya.j0210@gmail.com','office.admin@iith.ac.in','jr.ms@iith.ac.in']

        report_table.update_item(
            Key={'Report_ID': report_id},
            UpdateExpression='SET Supervisor_email = :supervisor_email',
            ExpressionAttributeValues={
                ':supervisor_email': target_supervisor_email
            },
            ReturnValues='ALL_NEW'
        )
        print(target_supervisor_email)

        for t_supervisor_email in target_supervisor_email:
            notification_item = {
                'Supervisor_Notification_ID': int(time.time() * 1000),
                'is_read': False,
                'message': "New complaints recieved",
                'Notification_type': 'Status Update',
                'Notified_time': int(datetime_utc.strftime('%Y%m%d%H%M%S')),
                'Report_ID': report_id,
                'Report_status': new_status,
                'Student_email': client_email,
                'Supervisor_email': t_supervisor_email,
                'Picture': picture,
                'Coordinates': [Decimal(str(pinLat)), Decimal(str(pinLng))],
            }
            print(notification_item)
            Supervisor_notification_table.put_item(Item=notification_item)

        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({'message': 'Report status updated and notification added successfully'})
        }

    except ClientError as e:
        print(f"Error updating status and adding notification: {e}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'message': 'Failed to update report and add notification', 'error': str(e)})
        }

    except Exception as e:
        print(f"Unexpected error: {e}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'message': 'Unexpected error', 'error': str(e)})
        }