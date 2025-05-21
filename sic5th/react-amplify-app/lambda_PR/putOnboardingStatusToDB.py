# "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved"

import json
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('User')
CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,POST'
}

def update_user_onboarding_status(user_email):
    try:
        response = table.update_item(
            Key={'Student_email': user_email},
            UpdateExpression="SET hasSeenOnboarding = :status",
            ExpressionAttributeValues={":status": True},
            ReturnValues="UPDATED_NEW"
        )
        return response
    except Exception as e:
        print(f"Error updating user status: {str(e)}")
        raise Exception(f"Error updating user status: {str(e)}")

def lambda_handler(event, context):
    body = json.loads(event['body'])
    user_email = body.get('useremail')
    print(user_email)
    if not user_email:
        return {
            "statusCode": 400,
            'headers': CORS_HEADERS,
            "body": json.dumps("Missing parameters: useremail")
        }
    try:
        update_user_onboarding_status(user_email)
        return {
            "statusCode": 200,
            'headers': CORS_HEADERS,
            "body": json.dumps({"hasSeenOnboarding": True})
        }
    except Exception as e:
        return {
            "statusCode": 500,
            'headers': CORS_HEADERS,
            "body": json.dumps(f"Error handling request: {str(e)}")
        }