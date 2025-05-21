# "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved"

import json
import boto3
from boto3.dynamodb.types import TypeDeserializer
from decimal import Decimal

dynamodb = boto3.client('dynamodb', region_name='ap-south-1')
deserializer = TypeDeserializer()

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def lambda_handler(event, context):
    try:
        items = []
        scan_kwargs = {
            'TableName': 'Report'
        }
        while True:
            response = dynamodb.scan(**scan_kwargs)
            items.extend([
                {key: deserializer.deserialize(value) for key, value in item.items()}
                for item in response['Items']
            ])
            # If the response does not contain a LastEvaluatedKey, all items have been retrieved.
            if 'LastEvaluatedKey' not in response:
                break
            scan_kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']
        
        return {
            'statusCode': 200,
            'body': json.dumps(items, cls=DecimalEncoder),
            'headers': {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        }
    
    except Exception as e:
        print('Error:', str(e))
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'Failed to fetch data', 'error': str(e)}),
        }