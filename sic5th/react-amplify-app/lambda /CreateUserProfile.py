# "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved"

import json
import boto3
from botocore.exceptions import ClientError

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,POST'
}

dynamodb = boto3.resource('dynamodb')

def put_user_item(user_email, user_name):
    print(f"Entering put_user_item function with email: {user_email}, user_name: {user_name}")
    table = dynamodb.Table('User')

    try:
        response = table.get_item(Key={'Student_email': user_email})
        existing_item = response.get('Item')
        if existing_item:
            print(f"User already exists: {existing_item}")

            # Update existing item if 'hasSeenOnboarding' is missing
            if 'hasSeenOnboarding' not in existing_item:
                print("Adding 'hasSeenOnboarding' attribute to existing user.")
                table.update_item(
                    Key={'Student_email': user_email},
                    UpdateExpression="SET hasSeenOnboarding = :val",
                    ExpressionAttributeValues={':val': False}
                )
                print(f"'hasSeenOnboarding' set to False for {user_email}.")
        else:
            # New user - insert the item with 'hasSeenOnboarding' set to False
            item = {
                'Student_email': user_email,
                'User_name': user_name,
                'Profile_picture': '',
                'Points': 0,
                'Number_of_Reports': 0,
                'hasSeenOnboarding': False
            }
            table.put_item(Item=item)
            print(f"New user added to the User table: {user_email}")

    except ClientError as e:
        print(f"ClientError adding item to User table: {e}")
        print(f"Error code: {e.response['Error']['Code']}")
        print(f"Error message: {e.response['Error']['Message']}")
    except Exception as e:
        print(f"General Error adding item to User table: {e}")
        import traceback
        print(traceback.format_exc())

def put_supervisor_item(supervisor_email, user_name):
    print(f"Entering put_supervisor_item function with email: {supervisor_email}, user_name: {user_name}")
    table = dynamodb.Table('Supervisor')
    region_table = dynamodb.Table('Region')
    region_response = region_table.query(
            IndexName='SupervisorEmailIndex',  # Replace with your GSI name
            KeyConditionExpression=boto3.dynamodb.conditions.Key('Supervisor_email').eq(supervisor_email)
        )
    region = [item['Region'] for item in region_response['Items']] if region_response['Items'] else []
    item = {
        'Supervisor_email': supervisor_email,
        'User_name': user_name,
        'Profile_picture': '',
        'Number_of_Reports_Solved': 0,
        'Regions':region
    }
    print(f"Attempting to put item in Supervisor table: {item}")
    try:
        response = table.put_item(Item=item)
        print(f'Item successfully added to the Supervisor table: {supervisor_email}')
        print(f"Response from DynamoDB: {response}")
    except ClientError as e:
        print(f"ClientError adding item to Supervisor table: {e}")
        print(f"Error code: {e.response['Error']['Code']}")
        print(f"Error message: {e.response['Error']['Message']}")
    except Exception as e:
        print(f"General Error adding item to Supervisor table: {e}")
        import traceback
        print(traceback.format_exc())

def get_supervisor_emails():
    # DynamoDBのRegionテーブルからSupervisor_emailを取得
    table = dynamodb.Table('Region')
    try:
        response = table.scan()
        supervisor_emails = [item['Supervisor_email'] for item in response['Items']]
        return supervisor_emails
    except ClientError as e:
        print(f"ClientError getting Supervisor emails from Region table: {e}")
        print(f"Error code: {e.response['Error']['Code']}")
        print(f"Error message: {e.response['Error']['Message']}")
    except Exception as e:
        print(f"General Error getting Supervisor emails from Region table: {e}")
        import traceback
        print(traceback.format_exc())
        return []

def lambda_handler(event, context):
    try:
        user_email = event['request']['userAttributes']['email']
        user_name = user_email.split('@')[0]

        print(f"Processing email: {user_email}")

        supervisor_emails = get_supervisor_emails()
        if user_email in supervisor_emails:
            put_supervisor_item(user_email, user_name)
            put_user_item(user_email, user_name)
        else:
            print("Calling put_user_item function") 
            put_user_item(user_email, user_name)

        return event
    except Exception as e:
        print(f"General Error in lambda_handler: {e}")
        import traceback
        print(traceback.format_exc())
        return event