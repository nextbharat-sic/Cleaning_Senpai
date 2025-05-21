# "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved"

import json
import boto3
import time
import traceback
from decimal import Decimal, getcontext, Inexact
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Attr

dynamodb = boto3.resource('dynamodb')
report_table = dynamodb.Table('Report')
notification_table = dynamodb.Table('Notification')
Supervisor_notification_table = dynamodb.Table('Supervisor_Notification')
Region_table = dynamodb.Table('Region')

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
        print(body)
        report_id = body.get('Report_ID')
        new_status = body.get('Report_status')
        client_email = body.get('Client_email')
        picture = body.get('Picture')

        region_supervisor_emails = get_supervisor_emails(Region_table)
            
        response = report_table.get_item(Key={'Report_ID': report_id})
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': CORS_HEADERS,
                'body': json.dumps({'message': 'Report not found.'})
            }
        student_email = response['Item'].get('Student_email')
        
        message = ''

        if new_status == 'cleaned':
            message = 'Got cleaned!!'
        elif new_status == 'denied':
            message = 'Got denied...'

        notification_item = {
            'Notification_ID': int(time.time() * 1000),
            'is_read': False,
            'message': message,
            'Notification_type': 'Status Update',
            'Notified_time': int(time.time() * 1000),
            'Report_ID': report_id,
            'Report_status': new_status,
            'Student_email': student_email,
            'Supervisor_email': client_email,
            'Picture': picture,
        }
        notification_table.put_item(Item=notification_item)
        response_notification = Supervisor_notification_table.query(
            IndexName="ReportID-index",
            KeyConditionExpression="Report_ID = :report_id",
            ExpressionAttributeValues={":report_id": report_id}
        )
        print(response_notification)
        if response_notification:
            print('Supervisor_Notification is : ',response_notification)
            if 'Items' in response_notification and len(response_notification['Items']) > 0:
                for item in response_notification['Items']:
                    notification_id = item['Supervisor_Notification_ID']
                    Supervisor_notification_table.delete_item(
                        Key={'Supervisor_Notification_ID': notification_id}
                    )
                    print('delete successfully : ',notification_id)
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