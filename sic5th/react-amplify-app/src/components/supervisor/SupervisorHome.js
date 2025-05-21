/* "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved" */

import React, { useEffect, useState, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import MapFeatures from "./MapFeatures";
import Notification from "./SupervisorNotification";
import NavigationBarSupervisor from "./NavigationBar";
import { css } from "@emotion/react";
import { ClipLoader } from "react-spinners";
import axios from "axios";
import { getCurrentUser } from "@aws-amplify/auth";


const override = css`
  display: block;
  margin: 0 auto;
  border-color: #36d7b7;
`;

function Home() {
  const mapRef = useRef(null);
  const navBarRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapHeight, setMapHeight] = useState("86vh");
  const [reportDelay, setReportDelay] = useState(null);
  const [alertShown, setAlertShown] = useState(false);

  useEffect(() => {
    const fetchReportStatus = async () => {
      try {
        const response = await axios.get(process.env.REACT_APP_AWS_APIGATEWAY_ENDPOINT_HOME);
  
        const data1 = response.data.body;
        const data = JSON.parse(data1)
        const user = await getCurrentUser();
        const username = user.signInDetails.loginId;
  
        if (data.reportDelayInfo && data.reportDelayInfo.length > 0) {
          const delayMessage = data.reportDelayInfo
            .filter(item => data.supervisorEmail === username)
            .map(item => `Report ID: ${item.reportID} is delayed!`)
            .join("\n");
          setReportDelay(delayMessage);
          }
        } catch (error) {
          console.error("Error fetching report status:", error);
        }
      };
  
    fetchReportStatus();
  }, []);
  

  useEffect(() => {
    if (reportDelay && !alertShown) {
      window.alert(reportDelay);
      setAlertShown(true);
    }
  }, [reportDelay, alertShown]);

  useEffect(() => {
    const apiKey = process.env.REACT_APP_AWS_AMAZON_LOCATION_SERVOCE_MAP_API_KEY;
    const mapName = process.env.REACT_APP_AWS_AMAZON_LOCATION_SERVOCE_MAP_NAME;
    const region = process.env.REACT_APP_AWS_AMAZON_LOCATION_SERVOCE_REGION;
    
    const initialZoom = 8;
    const initialCenter = [78.122662, 17.592865];

    const targetBounds = [
      [78.114192, 17.57942], // outside of main gate
      [78.131132, 17.60631], // behind sncc
    ];

    const map = new maplibregl.Map({
      container: "map",
      style: `https://maps.geo.${region}.amazonaws.com/maps/v0/maps/${mapName}/style-descriptor?key=${apiKey}`,
      zoom: initialZoom,
      center: initialCenter,
      maxBounds: targetBounds,
      maxZoom: 17.4,
      pitch: 0,
      bearing: 0,
    });

    map.on("load", () => {
      map.fitBounds(targetBounds, {
        padding: 20,
        duration: 3000,
      });

      setIsMapLoading(false);
      map.getContainer().style.visibility = 'visible';
    });

    mapRef.current = map;
    setMapInstance(map);

    return () => map.remove();
  }, []);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.target === navBarRef.current) {
          const navBarHeight = entry.contentRect.height;
          const notificationHeight = 58;
          const calculatedMapHeight = `calc(100vh - ${navBarHeight}px - ${notificationHeight}px)`;
          setMapHeight(calculatedMapHeight);
        }
      }
    });

    if (navBarRef.current) {
      resizeObserver.observe(navBarRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [navBarRef]);

  return (
    <div>
      <Notification map={mapInstance}/>
      <div
        id="map"
        style={{
          width: "100%",
          height: mapHeight,
        }}
      />
      {isMapLoading ? (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 2,
          }}
        >
          <ClipLoader
            color={"#36D7B7"}
            loading={true}
            css={override}
            size={150}
          />
        </div>
      ) : (
        mapInstance && (
          <MapFeatures map={mapInstance} setIsMapLoading={setIsMapLoading} />
        )
      )}
      <NavigationBarSupervisor ref={navBarRef} />
    </div>
  );
}

export default Home;