# "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved"

import json
import boto3

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,DELETE'
}

dynamodb = boto3.client('dynamodb', region_name='ap-south-1')
table_name = 'Notification'

def lambda_handler(event, context):
    query_params = event.get('queryStringParameters', {})
    notification_id = query_params.get('notificationId', None)
    primary_key = {'Notification_ID': {'N': notification_id}}

    if not notification_id:
        print("Error: notificationId parameter is required")
        return {
            'statusCode': 400,
            'headers': CORS_HEADERS,
            'body': json.dumps({'message': 'notificationId parameter is required'})
        }
    print(f"Table Name: {table_name}")
    print(f"Primary Key: {primary_key}")

    try:
        response = dynamodb.delete_item(
            TableName=table_name,
            Key=primary_key
        )

        print(f"DeleteItem response: {response}")

        if response['ResponseMetadata']['HTTPStatusCode'] == 200:
            print("Notification deleted successfully")
            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps({'message': 'Notification deleted successfully'})
            }
        else:
            print("Error: Failed to delete notification")
            return {
                'statusCode': 500,
                'headers': CORS_HEADERS,
                'body': json.dumps({'message': 'Failed to delete notification'})
            }

    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'message': 'Error deleting notification'})
        }

