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
    print("Lambda function started for User (fetchNotifications)")
    print(f"Event: {json.dumps(event)}")

    query_params = event.get('queryStringParameters', {})
    print(f"Query Parameters: {query_params}")

    student_email = query_params.get('studentEmail', None)

    print(f"Fetching notifications for studentEmail: {student_email}")

    if not student_email:
        print("Error: studentEmail parameter is required")
        return {
            'statusCode': 400,
            'headers': CORS_HEADERS,
            'body': json.dumps({'message': 'studentEmail parameter is required'})
        }

    try:
        if 'iith.ac.in' in student_email or student_email.endswith('@hhq.suzuki.co.jp') or student_email.endswith('@nextbharat.ventures'):
            response = dynamodb.query(
                TableName='Notification',
                IndexName='Student_email-index',
                KeyConditionExpression='Student_email = :email',
                ExpressionAttributeValues={
                    ':email': {'S': student_email}
                }
            )

            notifications = response.get('Items', [])

            print(f"DynamoDB response: {response}")
            print(f"Notifications found: {notifications}")

            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps({
                    'message': 'Notifications retrieved successfully for student',
                    'notifications': notifications
                })
            }
        else:
            print(f"Warning: Invalid email domain for user notification fetching: {student_email}")
            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps({
                    'message': 'No notifications found for this user',
                    'notifications': [] # 空の配列を返す
                })
            }

    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'message': 'Error retrieving student notifications'})
        }