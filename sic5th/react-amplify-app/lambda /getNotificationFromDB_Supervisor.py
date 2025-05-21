# "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved"

import json
import boto3

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,GET'
}

dynamodb = boto3.client('dynamodb', region_name='ap-south-1')

def lambda_handler(event, context):
    supervisor_email = event.get('queryStringParameters', {}).get('supervisorEmail')

    if not supervisor_email:
        return {
            'statusCode': 400,
            'headers': CORS_HEADERS,
            'body': json.dumps({'message': 'supervisorEmail parameter is required'})
        }

    try:
        response = dynamodb.query(
            TableName='Supervisor_Notification',
            IndexName='Supervisor_email-index', # GSI を使う
            KeyConditionExpression='Supervisor_email = :email',
            ExpressionAttributeValues={
                ':email': {'S': supervisor_email}
            },
            ScanIndexForward=False  # 新しい通知を上に表示
        )

        notifications = response.get('Items', [])
        print(notifications)

        if not notifications:
            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps({'message': 'No notifications found for this supervisor email'})
            }

        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'message': 'Notifications retrieved successfully for supervisor',
                'notifications': notifications
            })
        }

    except Exception as e:
        print(e)
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'message': 'Error retrieving supervisor notifications'})
        }