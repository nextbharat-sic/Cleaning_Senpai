# "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved"

import json
import boto3
import time
from datetime import datetime
from boto3.dynamodb.conditions import Key, Attr

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,POST'
}

def lambda_handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    print(event)
    report_id = event['Report_ID']

    report_table = dynamodb.Table('Report')
    supervisor_notification_table = dynamodb.Table('Supervisor_Notification')

    response = supervisor_notification_table.scan(
        FilterExpression=Attr('Report_ID').eq(report_id)
    )
    matching_notifications = response['Items']

    response = supervisor_notification_table.scan(
        FilterExpression=Attr('Report_ID').eq(report_id)
    )
    print(response)
    matching_notifications = response['Items']
    print("matching:", matching_notifications)

    for notification in matching_notifications:
        new_notification = notification.copy()
        new_notification['Supervisor_Notification_ID'] = int(time.time()*1000)
        new_notification['Notified_time'] = datetime.now().isoformat()
        new_notification['Supervisor_email'] = "azryo0416@gmail.com"# need to changes for PR

        supervisor_notification_table.put_item(Item=new_notification)
        print(notification['Supervisor_Notification_ID'])

        supervisor_notification_table.delete_item(
            Key={
                'Supervisor_Notification_ID': notification['Supervisor_Notification_ID']
            }
        )
        print("after:",supervisor_notification_table)
    report_table.update_item(
        Key={
            'Report_ID': report_id
        },
        UpdateExpression="set Supervisor_email = :e",
        ExpressionAttributeValues={
            ':e': "azryo0416@gmail.com" # need to changes for PR
        }
    )
    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': json.dumps('Successfully updated supervisor email and notifications.')
    }