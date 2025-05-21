# "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved"

import boto3
import json
from botocore.exceptions import ClientError

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,POST'
}

def lambda_handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('Report')

    try:
        body = json.loads(event['body'])
        report_id = body.get('Report_ID')
        response = table.update_item(
            Key={
                'Report_ID': report_id
            },
            UpdateExpression="set Report_status = :r",
            ExpressionAttributeValues={
                ':r': 'cleaned'
            },
            ReturnValues="UPDATED_NEW"
        )
    except ClientError as e:
        print(e.response['Error']['Message'])
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({"message": "Internal server error"})
        }
    else:
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({"message": "The status chenged to DynamoDB successfully!"})
        }