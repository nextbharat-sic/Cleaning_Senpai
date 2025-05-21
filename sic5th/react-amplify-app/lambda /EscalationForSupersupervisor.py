# "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved"

import json
import datetime as dt
import boto3
from decimal import Decimal

ses_client = boto3.client('ses', region_name='ap-south-1')

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,GET'
}
IST_OFFSET = dt.timedelta(hours=5, minutes=30)

def send_email(subject, body, to_addresses, cc_addresses=None):
    try:
        destination = {
            'ToAddresses': to_addresses,
        }
        
        if cc_addresses:
            destination['CcAddresses'] = cc_addresses
        
        response = ses_client.send_email(
            Source='agile5th@nextbharat.ventures',
            Destination=destination,
            Message={
                'Subject': {
                    'Data': subject,
                    'Charset': 'UTF-8',
                },
                'Body': {
                    'Text': {
                        'Data': body,
                        'Charset': 'UTF-8',
                    },
                },
            },
        )
        print(f"Email sent! Message ID: {response['MessageId']}")
    except Exception as e:
        print(f"Error sending email: {str(e)}")


def check_report_date(notified: str , supervisor_email: str):
    report_date = dt.datetime.strptime(notified, "%Y%m%d")
    today_utc = dt.datetime.utcnow()
    today_ist = today_utc + IST_OFFSET

    three_days_ago = today_ist - dt.timedelta(days=3)

    if report_date <= three_days_ago:
        print('late!')
        # subject = "Report Delay Notification"
        # body = f"Report with ID {report_ID} is delayed by more than 3 days."
        
        # # メールを送る宛先（To）とCC
        # to_addresses = [supervisor_email] 
        # cc_addresses = ["agile5th@nextbharat.ventures"]  # JRARとdeveloperのメール予定
        
        # send_email(subject, body, to_addresses, cc_addresses)
        return True
    else:
        print('OK')
        return False


def lambda_handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    try:
        items = []
        scan_kwargs = {
            'TableName': 'Supervisor_Notification'
        }

        while True:
            response = dynamodb.Table('Supervisor_Notification').scan(**scan_kwargs)
            items.extend(response['Items'])

            if 'LastEvaluatedKey' not in response:
                break
            scan_kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']

        report_delay_info = []

        for item in items:
            try:
                if 'Notified_time' in item:
                    notified_time_decimal = item['Notified_time']
                    notified_time = int(Decimal(notified_time_decimal))
                    report_id_decimal = item['Report_ID']
                    report_id = int(Decimal(report_id_decimal))
                    notified_time_str = str(notified_time)[:8]

                    supervisor_email = item['Supervisor_email']

                    is_late = check_report_date(notified_time_str, supervisor_email)

                    if is_late:
                        report_delay_info.append({
                            'reportID': report_id,
                            'supervisorEmail': supervisor_email,
                            'isLate': True
                        })
                else:
                    print(f"Missing Report_ID in item: {item}")

            except KeyError as e:
                print(f"Error processing item {item}: Missing expected field {str(e)}")
            except Exception as e:
                print(f"Unexpected error with item {item}: {str(e)}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Process completed successfully',
                'reportDelayInfo': report_delay_info
            }),
            'headers': CORS_HEADERS
        }

    except Exception as e:
        print('Error:', str(e))
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'Failed to fetch data', 'error': str(e)}),
            'headers': CORS_HEADERS
        }