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
    table = dynamodb.Table('Region')  # Replace with your table name
    supervisor_email = event['queryStringParameters'].get('supervisorEmail')

    if not supervisor_email:
        return {
            'statusCode': 400,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'supervisorEmail query parameter is required'})
        }

    try:
        # Query the GSI
        response = table.query(
            IndexName='SupervisorEmailIndex',  # Replace with your GSI name
            KeyConditionExpression=boto3.dynamodb.conditions.Key('Supervisor_email').eq(supervisor_email)
        )
        print(f"Response: {response}")
    except ClientError as e:
        print(f"DynamoDB error: {e.response['Error']['Message']}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Could not retrieve user region'})
        }
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Internal server error'})
        }

    # Check if items were returned
    items = response.get('Items', [])
    print(f"Items: {items}")
    if items:
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps(items)
        }
    else:
        return {
            'statusCode': 404,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Supervisor email not found'})
        }

# "Copyright © 2025 Suzuki Motor Corporation Al Rights Reserved"