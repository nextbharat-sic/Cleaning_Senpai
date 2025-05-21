/* "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved" */

import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import maplibregl from "maplibre-gl";
import axios from "axios";
import "./MapFeatures.css";
import landmarksJSON from "../../data/landmarks.json";
import IITHCampusGeofence from "../../data/IITHCampusGeofence.json";
import { getCurrentUser } from "@aws-amplify/auth";

const MapFeatures = ({ map, setIsMapLoading }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [reportLocations, setReportLocations] = useState([]);
  const markerRef = useRef(null);
  const popupRef = useRef(null);
  const userMarkerRef = useRef(null);
  const [greenPinPopupVisible, setGreenPinPopupVisible] = useState(false);
  const navigate = useNavigate();
  const placePinRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (map && !isMapLoaded) {
      const checkIfMapIsLoaded = setInterval(() => {
        if (map.loaded()) {
          setIsMapLoaded(true);
          clearInterval(checkIfMapIsLoaded);
        }
      }, 100);
    }
  }, [map, isMapLoaded]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newUserLocation = [longitude, latitude];
          setUserLocation(newUserLocation);
          localStorage.setItem("userLocation", JSON.stringify(newUserLocation));
        },
        (error) => {
          console.error("location error:", error);
          alert(
            "could not get location data. Please allow us to obtain your location information"
          );
        },
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    } else {
      alert("In this browser, we couldn't get the location information.");
    }
  }, [setIsMapLoading]);

  // Fetch report locations using axios
  useEffect(() => {
    const fetchLocations = async () => { 
      const user = await getCurrentUser();
      const userEmail = user.signInDetails.loginId;
      try {
        const response = await axios.get(
          process.env.REACT_APP_AWS_APIGATEWAY_ENDPOINT_COMPLAINT,
          {
            params: {
              useremail: userEmail,
            },
            headers: {
              "x-api-key": process.env.REACT_APP_AWS_APIGATEWAY_API_KEY,
            },
          }
        );
        const untouchedReports = response.data.filter(
          (report) => report.Report_status === "untouched"
        );
        setReportLocations(untouchedReports);
        localStorage.setItem(
          "reportLocations",
          JSON.stringify(untouchedReports)
        );
      } catch (error) {
        console.error("Error fetching locations from API:", error);
      }
    };
    fetchLocations();
  }, []);

  // Initialize map only after user location is available
  useEffect(() => {
    if (map && userLocation && !mapInstance && isMapLoaded) {
      setMapInstance(map);

      const initializeMap = () => {
        const fallbackLocation = [78.1227, 17.5908]; // Coordinates for IITH campus or a specific location

        const locationDict = {
          lat: userLocation[1],
          lng: userLocation[0],

        };
        if (userLocation && isInsideGeofence(locationDict)) {
          map.flyTo({
            center: userLocation, // Uses userLocation as targetLocation in this case
            zoom: 17, // Zoom in for user-specific location
            essential: true,
            speed: 0.5,
            curve: 1,
          });
        } else {
          // Handle the fallback location when userLocation is not available or outside campus
          map.flyTo({
            center: fallbackLocation,
            zoom: 14,
            essential: true,
            speed: 0.5,
            curve: 1,
          });
        }

        const userMarker = new maplibregl.Marker({
          element: document.createElement("div"),
        })
          .setLngLat(userLocation)
          .addTo(map);

        userMarker.getElement().classList.add("blue-pin");
        userMarkerRef.current = userMarker;

        map.dragRotate.disable();
        map.touchZoomRotate.disableRotation();

        // Create landmark pins
        function createLandmarkPinElement(name = "") {
          const element = document.createElement("div");
          element.classList.add("landmark-pin");

          if (name) {
            const label = document.createElement("div");
            label.innerText = name;
            label.classList.add("landmark-label");
            element.appendChild(label);
          }
          return element;
        }

        landmarksJSON.forEach((landmark) => {
          const pinElement = createLandmarkPinElement(landmark.name);
          new maplibregl.Marker({ element: pinElement })
            .setLngLat(landmark.coordinates)
            .addTo(map);
        });
        setIsMapLoading(false);
      };
      if (map.loaded()) {
        initializeMap();
      } else {
        map.on("load", () => {
          initializeMap();
        });
      }
    }
  }, [userLocation, map, mapInstance, isMapLoaded, setIsMapLoading]);

  useEffect(() => {
    if (mapInstance && reportLocations.length > 0) {
      reportLocations.forEach((reportInfo) => {
        const pinLat = reportInfo.Pin_location?.M?.lat;
        const pinLng = reportInfo.Pin_location?.M?.lng;
        const popupReportInfo = new maplibregl.Popup({ offset: 50 }).setHTML(`
          <div style="max-width: 200px;">
            <img src="${
              reportInfo.Picture
            }" alt="Report Image" style="width: 100%; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); height: auto;" />
            <p style="font-size: 14px; color: #333; margin: 0; line-height: 1.4;">
              ${reportInfo.Description}
            </p>
            <p style="font-size: 12px; color: #888; margin-top: 8px; margin-bottom: 0px; text-align: right;">
              ${reportInfo.Report_date || "Not available"}
            </p>
          </div>
        `);

        popupReportInfo.on("open", () => {
          const popupElement = popupReportInfo.getElement();
          const closeButton = popupElement.querySelector("button");
          closeButton.classList.add("close-button");
        });

        if (pinLat && pinLng) {
          const greenMarker = new maplibregl.Marker({ color: "rgb(0, 193, 47)" })
            .setLngLat([pinLng, pinLat])
            .setPopup(popupReportInfo)
            .addTo(mapInstance);

          greenMarker.getElement().classList.add("green-pin");

          greenMarker.getElement().addEventListener("click", () => {
            setGreenPinPopupVisible(true);
          });
          popupReportInfo.on("open", () => {
            const popupElement = popupReportInfo.getElement();
            popupElement.style.zIndex = "10";
          });
        }
      });
    }
  }, [mapInstance, reportLocations]);

  const isInsideGeofence = (lngLat) => {
    const lat = lngLat.lng; // Latitude of the point, don't change
    const lon = lngLat.lat; // Longitude of the point

    const data = IITHCampusGeofence.features[0];

    let isInside = false;
    const polygon = data.geometry.coordinates[0];

    const numPoints = polygon.length;
    let j = numPoints - 1;

    for (let i = 0; i < numPoints; i++) {
      const [lon1, lat1] = polygon[i];
      const [lon2, lat2] = polygon[j];
      if ((lat1 > lat) !== (lat2 > lat)) {
        const lonCross = ((lat - lat1) * (lon2 - lon1)) / (lat2 - lat1) + lon1;

        if (lonCross > lon) {
          isInside = !isInside;
        }
      }
      j = i;
    }

    return isInside;
  };

  // Pin Marker and Popup Logic
  const placePin = useCallback(
    (lngLat) => {

      setGreenPinPopupVisible(false);

      // Remove existing pin and popup
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }

      if (isInsideGeofence(lngLat)) {
        if (!greenPinPopupVisible) {
          const newMarker = new maplibregl.Marker({ color: "red" })
            .setLngLat(lngLat)
            .addTo(map);
          markerRef.current = newMarker;
          newMarker.getElement().style.zIndex = "9";
        }

        const popupContent = document.createElement("div");
        popupContent.innerHTML = `
          <button id="click-photo-button" class="click-photo-button">Click Photo</button>
        `;
        popupContent.style.padding = "10px";

        const closeButton = document.createElement("button");
        closeButton.innerText = "×";
        closeButton.classList.add("close-button");
        closeButton.addEventListener("click", () => {
          if (popupRef.current) {
            popupRef.current.remove();
            popupRef.current = null;
          }
          if (markerRef.current) {
            markerRef.current.remove();
            markerRef.current = null;
          }
        });

        popupContent.appendChild(closeButton);

        if (!greenPinPopupVisible) {
          const popupSendButton = new maplibregl.Popup({
            offset: 25,
            closeButton: false,
            closeOnClick: false,
          })
            .setLngLat(lngLat)
            .setDOMContent(popupContent)
            .addTo(map);
          popupRef.current = popupSendButton;
          popupSendButton.getElement().style.zIndex = "10";
        }

        const clickPhotoButton = popupContent.querySelector(
          "#click-photo-button"
        );
        clickPhotoButton.addEventListener("click", () => {
          const coordinates = {
            pin: lngLat,
            user: userLocation,
          };
          localStorage.setItem("coordinates", JSON.stringify(coordinates));
          navigate("/webcamcaptureuser");
        });
      } else {
          let msg = document.createElement('div');
          msg.textContent = 'Location NOT in IITH Campus';
          msg.style.position = 'fixed';
          msg.style.width = '70%';
          msg.style.top = '10%';
          msg.style.left = '50%';
          msg.style.transform = 'translateX(-50%)';
          msg.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
          msg.style.color = 'white';
          msg.style.padding = '10px';
          msg.style.paddingLeft = '10px';
          msg.style.borderRadius = '15px';
          msg.style.fontSize = '16px';
          msg.style.zIndex = 9999;
          msg.style.display = 'flex';
          msg.style.justifyContent = 'center';
          msg.style.alignItems = 'center';

          document.body.appendChild(msg);

          setTimeout(() => {
              msg.style.transition = 'opacity 0.5s ease-out';
              msg.style.opacity = '0';
              setTimeout(() => msg.remove(), 500);
          }, 2000);
      }
    },
    [map, userLocation, navigate, greenPinPopupVisible]
  );

  useEffect(() => {
    placePinRef.current = placePin;
  }, [placePin]);

  useEffect(() => {
    let clickHandler, contextmenuHandler;
    if (map) {
      clickHandler = (e) => {
        if (placePinRef.current) {
          placePinRef.current(e.lngLat);
        }
      };
      map.on("click", clickHandler);

      contextmenuHandler = (e) => {
        if (placePinRef.current) {
          placePinRef.current(e.lngLat);
        }
      };
      map.on("contextmenu", contextmenuHandler);
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      if (map && clickHandler) {
        map.off("click", clickHandler);
      }
      if (map && contextmenuHandler) {
        map.off("contextmenu", contextmenuHandler);
      }
    };
  }, [map]);

  return <div id="map" style={{ width: "100%", height: "100%" }}></div>;
};

export default MapFeatures;