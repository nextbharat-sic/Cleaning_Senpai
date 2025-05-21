# "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved"

import json
import boto3
from math import radians, sin, cos, sqrt, atan2

location_client = boto3.client('location')
CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,POST'
}
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Report')

def update_region(report_id, new_region):
    response = table.get_item(Key={'Report_ID': report_id})

    if 'Item' not in response:
        return {
            "statusCode": 404,
            "headers": CORS_HEADERS,
            "body": f"Report with Report_ID {report_id} not found."
        }
    table.update_item(
        Key={'Report_ID': report_id},
        UpdateExpression="SET #Region = :Region",
        ExpressionAttributeNames={"#Region": "Region"},
        ExpressionAttributeValues={":Region": new_region},
        ReturnValues="UPDATED_NEW"
    )

    return {
        "statusCode": 200,
        "headers": CORS_HEADERS,
        "body": f"Region successfully updated to {new_region} for Report_ID {report_id}."
    }

def is_point_in_polygon(lat, lon, polygon):
    num_points = len(polygon)
    inside = False
    x_intercept = lat
    y_intercept = lon

    for i in range(num_points):
        j = (i + 1) % num_points
        x1, y1 = polygon[i]
        x2, y2 = polygon[j]
        if min(y1, y2) < y_intercept <= max(y1, y2):
            x_cross = (y_intercept - y1) * (x2 - x1) / (y2 - y1) + x1
            if x_cross > x_intercept:
                inside = not inside
    return inside

def lambda_handler(event, context):
    print(event)
    body = json.loads(event['body'])
    report_id = body.get('reportId')
    latitude = body.get('userLat')
    longitude = body.get('userLng')

    print(latitude)
    print(longitude)
    
    geofence_collection_name = 'ReactAmplifyAppGeofence'
    
    # list of geofence
    geofence_ids = [
        'SNCC', 'Dominos', 'Old_Hostels_KL_Hostel', 'Old_Sports_Grounds_KL_Sports','Old_Hostels_Kapila_shed_KL_Hostel','Old_Mess_Hostel_Office','New_Hostels_KL_Hostels','New_Mess_Hostel_Office','Chilling_Plant_SNCC_KL_SNCC','PhyChem_Labs',"Workshops_Labs","Academic_Blocks","GreenOffice_Road_behindBTBM","Green_Office_MainRoad_till_marriedHostels","Married_Hostels","GreenOffice_Road_Hospital_TRP","Hospital","TIP","TRP","Waste_Processing_Area_SNCC_chiller_plant",'GreenOffice_road_beside_TRP'
    ]
    
    try:
        region_name = 'admin'
        for geofence_id in geofence_ids:
            print(geofence_id)
            response = location_client.get_geofence(
                CollectionName=geofence_collection_name,
                GeofenceId=geofence_id
            )
            
            geofence_geometry = response['Geometry']
            polygon_coordinates = geofence_geometry['Polygon'][0]
            print(polygon_coordinates)
            
            if is_point_in_polygon(latitude, longitude, polygon_coordinates):
                print(latitude)
                print(longitude)
                region_name = geofence_id

        if region_name == 'admin':
            print('Point is outside of geofences')
            print(region_name)
            update_region(report_id, region_name)
            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps({
                    'message': 'Point is outside of pointing',
                    'geofences': region_name
                })
            }
        else:
            print('Point is inside the following geofences:', region_name)
            print(region_name)
            update_region(report_id, region_name)
            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps({
                    'message': 'Point is inside the following geofences',
                    'geofences': region_name
                })
            }
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'message': 'Error processing request', 'error': str(e)})
        }