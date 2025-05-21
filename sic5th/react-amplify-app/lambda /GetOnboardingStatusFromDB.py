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

def lambda_handler(event, context):
    user_email = event['queryStringParameters']['useremail']
    print(user_email)
    if not user_email:
        return {
            "statusCode": 400,
            'headers': CORS_HEADERS,
            "body": json.dumps("Missing parameters: useremail")
        }
    
    try:
        response = table.get_item(
            Key={'Student_email': user_email}
        )
        if 'Item' not in response:
            return {
                "statusCode": 404,
                'headers': CORS_HEADERS,
                "body": json.dumps(f"User with email {user_email} not found.")
            }
        has_seen_onboarding = response['Item'].get('hasSeenOnboarding', False)
        if has_seen_onboarding:
            return {
                "statusCode": 200,
                'headers': CORS_HEADERS,
                "body": json.dumps({"hasSeenOnboarding": True})
            }
        else:
            return {
                "statusCode": 200,
                'headers': CORS_HEADERS,
                "body": json.dumps({"hasSeenOnboarding": False})
            }
    except Exception as e:
        return {
            "statusCode": 500,
            'headers': CORS_HEADERS,
            "body": json.dumps(f"Error handling request: {str(e)}")
        }