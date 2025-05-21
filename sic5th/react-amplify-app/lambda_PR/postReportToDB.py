# "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved"

import json
import boto3
import os
from datetime import datetime
from decimal import Decimal
from botocore.exceptions import ClientError

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,POST'
}

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Report')

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            if o % 1 > 0:
                return float(o)
            else:
                return int(o)
        return super(DecimalEncoder, self).default(o)

def generate_report_id():
    now = datetime.now()
    date_str = now.strftime("%Y%m%d")  # ex: 20250114
    time_str = now.strftime("%H%M%S")  # ex: 153012
    return int(date_str + time_str)  # ex: 20250114-153012

def put_report_item(table, new_report_id, description, pin_lat, pin_lng, image_b64, picture_timestamp, report_date, user_email):
    print(new_report_id)
    
    item = {
        'Report_ID': new_report_id,
        'Description': description,
        'Pin_location': {
            'M': {
                'lat': pin_lat,
                'lng': pin_lng
            }
        },
        'Picture': image_b64,
        'Picture_timestamp': picture_timestamp,
        'Region': 'default',
        'Report_date': report_date,
        'Report_status': "untouched",
        'Student_email': user_email,
        'Supervisor_email': "azryo0416@gmail.com",
        'Time_of_status_update_to_in_progress': 'null'
    }

    try:
        table.put_item(Item=item)
        print('Item successfully added to the table')
    except ClientError as e:
        print(f"Error adding item to table: {e.response['Error']['Message']}")

def lambda_handler(event, context):
    try:
        body = json.loads(event['body'])
        image_b64 = body.get('image')
        pin_lat = body.get('userLat')
        pin_lng = body.get('userLng')
        description = body.get('description')
        user_email = body.get('useremail')

        if pin_lat is None or pin_lng is None:
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({"message": "pin_lat and pin_lng must be provided."})
            }

        if not isinstance(pin_lat, (int, float)):
            try:
                pin_lat = float(pin_lat)
            except ValueError:
                raise TypeError("pin_lat must be a number.")
        if not isinstance(pin_lng, (int, float)):
            try:
                pin_lng = float(pin_lng)
            except ValueError:
                raise TypeError("pin_lng must be a number.")
        pin_lat = Decimal(str(pin_lat))
        pin_lng = Decimal(str(pin_lng))
        new_report_id = generate_report_id()

        now = datetime.now()
        report_date = int(now.strftime("%Y%m%d"))
        picture_timestamp = now.isoformat()

        put_report_item(table, new_report_id, description, pin_lat, pin_lng, image_b64, picture_timestamp, report_date, user_email)
        print('successfully to put')

        #(need to change)
        response_body = {
            "message": "Data received and item added to DynamoDB successfully!",
            "item": {
                'Report_ID': new_report_id,
                'userLat': pin_lat,
                'userLng': pin_lng,
                'Report_status': 'untouched',
                'Picture_timestamp': picture_timestamp,
                'Report_date': report_date
            }
        }

        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps(response_body, cls=DecimalEncoder)
        }

    except KeyError as e:
        print(f"KeyError: {e}, Event: {event}")
        return {
            'statusCode': 400,
            'headers': CORS_HEADERS,
            'body': json.dumps({"message": f"Missing key in request body: {e}"})
        }
    except TypeError as e:
        print(f"TypeError: {e}")
        return {
            'statusCode': 400,
            'headers': CORS_HEADERS,
            'body': json.dumps({"message": f"Invalid data type: {e}"})
        }
    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({"message": "Internal server error"})
        }