/* "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved" */

import React, { useEffect, useState, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import MapFeatures from "./MapFeatures";
import Notification from "./UserNotification";
import NavigationBarUser from "./NavigationBar";
import { css } from "@emotion/react";
import { ClipLoader } from "react-spinners";
import './Home.css'; 
import voicesData from '/home/ec2-user/sic5th/react-amplify-app/src/data/voices.json';

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
  const [showMessage, setShowMessage] = useState(false);
  const [opening, setOpening] = useState(() => {
    const savedOpening = localStorage.getItem("opening");
    return savedOpening === null ? true : JSON.parse(savedOpening);
  });

  useEffect(() => {
    localStorage.setItem("opening", JSON.stringify(opening));
  }, [opening]);

  useEffect(() => {
    if (opening) {
      const timer = setTimeout(() => {
        setShowMessage(true);
      }, 3500);
  
      return () => clearTimeout(timer);
    }
  }, [opening]); 

  useEffect(() => {
    if (opening) return; 
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
  }, [opening]);

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

  useEffect(() => {
    const handleClick = (event) => {
      if (opening) {
        const random_num = Math.floor(Math.random() * voicesData.voices.length);
        const voice = '/voices/cleaning_' + voicesData.voices[random_num] + '.wav';
        const audio = new Audio(voice);
        audio.play();
        setOpening(false);
        setShowMessage(false);
      }
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [opening]);

  return (
    <div>
      <div>
        {opening && (
          /iPhone|iPad|iPod/i.test(navigator.userAgent) ? (
            <img src="/images/logo512.png" alt="opening" className="opening-ios" />
          ) : (
            <video
              src="/videos/op_animation.mp4"
              alt="opening"
              className="opening"
              autoPlay
              muted
              onError={(e) => console.error("Error loading video", e)}
            />        
          )
        )}
        {showMessage && (
          <div className="tap-message show">Tap anywhere to continue</div>
        )}
      </div>

      {!opening && (
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
        <NavigationBarUser ref={navBarRef} />
      </div>
      )}
    </div>
  );
}

export default Home;