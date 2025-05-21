# "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved"

import json
import boto3
from boto3.dynamodb.conditions import Key
from decimal import Decimal

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,GET' 
}

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            if o % 1 > 0:
                return float(o)
            else:
                return int(o)
        return super(DecimalEncoder, self).default(o)

def lambda_handler(event, context):
    user_id = event['queryStringParameters']['userId']
    user_type = event['queryStringParameters']['userType']
    print(user_type)

    if user_type == 'user':
        table = dynamodb.Table('User')
        key_name = 'Student_email'
    elif user_type == 'supervisor':
        table = dynamodb.Table('Supervisor')
        key_name = 'Supervisor_email'
    else:
        return {
            'statusCode': 400,
            'headers': CORS_HEADERS,
            'body': json.dumps({'message': 'Invalid user type'})
        }

    try:
        response = table.query(
            KeyConditionExpression=Key(key_name).eq(user_id)
        )

        if 'Items' in response and len(response['Items']) > 0:
            item = response['Items'][0]
            if user_type == 'user':
                return {
                    'statusCode': 200,
                    'headers': CORS_HEADERS,
                    'body': json.dumps({
                        'username': item['User_name'],
                        'email': item['Student_email'],
                        'reportCount': item['Number_of_Reports'],
                        'points': item['Points']
                    }, cls=DecimalEncoder)
                }
            elif user_type == 'supervisor':
                return {
                    'statusCode': 200,
                    'headers': CORS_HEADERS,
                    'body': json.dumps({
                        'username': item['User_name'],
                        'email': item['Supervisor_email'],
                        'Region': item['Regions']
                    }, cls=DecimalEncoder)
                }
        else:
            return {
                'statusCode': 404,
                'headers': CORS_HEADERS,
                'body': json.dumps({'message': f'{user_type.capitalize()} not found'})
            }
    except Exception as e:
        print('Error:', e)
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'message': 'Internal Server Error'})
        }