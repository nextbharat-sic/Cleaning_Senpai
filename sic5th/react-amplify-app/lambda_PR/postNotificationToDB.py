# "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved"

import json
import boto3
import time
import traceback
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')
report_table = dynamodb.Table('Report')
supervisor_table = dynamodb.Table('Supervisor')
notification_table = dynamodb.Table('Notification')
Supervisor_notification_table = dynamodb.Table('Supervisor_Notification')
table = dynamodb.Table('Region')

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,POST'
}
def get_supervisor_emails():
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

        supervisor_emails = get_supervisor_emails()
        if client_email in supervisor_emails:
            response = report_table.get_item(Key={'Report_ID': report_id})
            if 'Item' not in response:
                return {
                    'statusCode': 404,
                    'headers': CORS_HEADERS,
                    'body': json.dumps({'message': 'Report not found.'})
                }
            student_email = response['Item'].get('Student_email')
            notification_item = {
                'Notification_ID': int(time.time() * 1000),
                'is_read': False,
                'message': f"Report {report_id} status has been updated to {new_status}.",
                'Notification_type': 'Status Update',
                'Notified_time': int(time.time() * 1000),
                'Report_ID': report_id,
                'Report_status': new_status,
                'Student_email': student_email,
                'Supervisor_email': client_email
            }
            notification_table.put_item(Item=notification_item)
            response_notification = Supervisor_notification_table.query(
                IndexName="ReportID-index",
                KeyConditionExpression="Report_ID = :report_id",
                ExpressionAttributeValues={":report_id": report_id}
            )
            if response_notification:
                print('Supervisor_Notification is : ',response_notification)
                if 'Items' in response_notification and len(response_notification['Items']) > 0:
                    notification_id = response_notification['Items'][0]['Supervisor_Notification_ID']
                    Supervisor_notification_table.delete_item(
                        Key={'Supervisor_Notification_ID': notification_id}
                    )
                    print('delete successfully : ',notification_id)
        elif 'iith.ac.in' in client_email or client_email.endswith('@hhq.suzuki.co.jp') or client_email.endswith('@nextbharat.ventures'):
            region = body.get('Region')
            print(region)
            response = supervisor_table.query(
                IndexName='Region-Supervisor_email-index',
                KeyConditionExpression=boto3.dynamodb.conditions.Key('Region').eq(region)
            )
            print(response)
            if 'Items' in response and len(response['Items']) > 0:
                supervisor_email = response['Items'][0].get('Supervisor_email')
            print('supervisor_email:',supervisor_email)

            update_response = report_table.update_item(
                Key={'Report_ID': report_id},
                UpdateExpression='SET Supervisor_email = :supervisor_email',
                ExpressionAttributeValues={
                    ':supervisor_email': supervisor_email
                },
                ReturnValues='ALL_NEW'
            )

            notification_item = {
                'Supervisor_Notification_ID': int(time.time() * 1000),
                'is_read': False,
                'message': f"Your report {report_id} status has been updated to {new_status}.",
                'Notification_type': 'Status Update',
                'Notified_time': int(time.time() * 1000),
                'Report_ID': report_id,
                'Report_status': new_status,
                'Student_email': client_email,
                'Supervisor_email': supervisor_email
            }
            Supervisor_notification_table.put_item(Item=notification_item)
        else:
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({'message': 'Invalid email address. The user must be either a supervisor or a student.'})
            }

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