# "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved"

import json
import boto3
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')
CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,OPTIONS,POST'
}

def lambda_handler(event, context):
    table = dynamodb.Table('Region')
    useremail = event['queryStringParameters'].get('useremail')
    print('Email:', useremail)

    if not useremail:
        return {
            'statusCode': 400,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'useremail query parameter is required'})
        }

    try:
        response = table.query(
            IndexName='SupervisorEmailIndex',
            KeyConditionExpression=boto3.dynamodb.conditions.Key('Supervisor_email').eq(useremail)
        )
        print(f"Response: {response}")
    except ClientError as e:
        print(f"DynamoDB error: {e.response['Error']['Message']}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Could not retrieve user information'})
        }
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Internal server error'})
        }

    item = response.get('Items')
    print(f"Items: {item}")
    if item:
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({'exists': True})
        }
    else:
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({'exists': False})
        }