/* "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved" */

import { useEffect, useState, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import axios from "axios";
import "./MapFeatures.css";
import { getCurrentUser } from "@aws-amplify/auth";
import IITHData from "../../data/IITHGeofence.json";
import landmarksJSON from "../../data/landmarks.json";
import { css } from "@emotion/react";
import { ClipLoader } from "react-spinners";

const override = css`
  display: block;
  margin: 0 auto;
  border-color: #36d7b7;
`;


const MapFeatures = ({ map, setIsMapLoading }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [reportLocations, setReportLocations] = useState([]);
  const markerRef = useRef(null);
  const popupRef = useRef(null);
  const [greenPinPopupVisible, setGreenPinPopupVisible] = useState(false);
  const placePinRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [inputID, setInputID] = useState([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

    const newUserLocation = [78.122662, 17.592865];
    setUserLocation(newUserLocation);
    localStorage.setItem("userLocation", JSON.stringify(newUserLocation));

    (async () => {
      const user = await getCurrentUser();
      const username = user.signInDetails.loginId;
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_AWS_APIGATEWAY_ENDPOINT_REGION}?supervisorEmail=${username}`,{
            headers: {
              'x-api-key': process.env.REACT_APP_AWS_APIGATEWAY_API_KEY,
            },
          }
        );
        if (response.data && response.data[0]?.Supervisor_email) {
          setInputID(response.data);
        }
      } catch (error) {
        console.error("Error fetching region data:", error);
      }
    })();
  }, []);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const user = await getCurrentUser();
        const userEmail = user.signInDetails.loginId;
        const response = await axios.get(
          process.env.REACT_APP_AWS_APIGATEWAY_ENDPOINT_COMPLAINT,{
            params: {
              useremail: userEmail,
            },
            headers: {
              'x-api-key': process.env.REACT_APP_AWS_APIGATEWAY_API_KEY,
            },
          }
        );
        const untouchedReports = response.data.filter(
          (report) => report.Report_status === "untouched"
        );
        setReportLocations(untouchedReports);
        localStorage.setItem("reportLocations", JSON.stringify(untouchedReports));
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };
    fetchLocations();
  }, [setIsMapLoading]);

  useEffect(() => {
    if (map && userLocation && !mapInstance && isMapLoaded) {
      setMapInstance(map);

      const initializeMap = () => {
        const createLandmarkPinElement = (name = "") => {
          const element = document.createElement("div");
          element.classList.add("landmark-pin");

          if (name) {
            const label = document.createElement("div");
            label.innerText = name;
            label.classList.add("landmark-label");
            element.appendChild(label);
          }
          return element;
        };

        landmarksJSON.forEach((landmark) => {
          const pinElement = createLandmarkPinElement(landmark.name);
          new maplibregl.Marker({ element: pinElement })
            .setLngLat(landmark.coordinates)
            .addTo(map);
        });

        const findPolygonDataByID = (id) => {
          return IITHData.features.find(
            (feature) => feature.properties.id === id
          );
        };

        const getPolygons = () => {
          return inputID.map((item) => {
            const region = item.Region;
            const data = findPolygonDataByID(region);
            if (data) {
              return data.geometry.coordinates[0].map(([lat, lon]) => [lon, lat]);
            }
            console.warn(`No polygon data found for region: ${region}`);
            return null;
          }).filter(Boolean);
        };

        const polygons = getPolygons();
        polygons.forEach((polygon, index) => {
          map.addSource(`polygon-${index}`, {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: [polygon],
              },
            },
          });

          map.addLayer({
            id: `polygon-${index}`,
            type: "line",
            source: `polygon-${index}`,
            paint: {
              "line-color": "#FF4500",
              "line-width": 7,
              "line-opacity": 0.9,
              "line-blur": 2,
            },
          });

          const bounds = new maplibregl.LngLatBounds();
          polygon.forEach((coord) => bounds.extend(coord));
          map.fitBounds(bounds, { padding: 50 });
        });

        setIsMapLoading(false);
      };

      initializeMap();
    }
  }, [userLocation, map, mapInstance, isMapLoaded, setIsMapLoading, inputID]);

  useEffect(() => {
    if (mapInstance && reportLocations.length > 0) {
      reportLocations.forEach((reportInfo, index) => {
        const pinLat = reportInfo.Pin_location?.M?.lat;
        const pinLng = reportInfo.Pin_location?.M?.lng;
        const popupReportInfo = new maplibregl.Popup({ offset: 50 }).setHTML(`
          <div style="max-width: 200px;">
            <img src="${reportInfo.Picture}" alt="Report Image" style="width: 100%; height: auto;" />
            <p style="margin-top: 0px; font-size: 14px; color: #333;">
              ${reportInfo.Description}
            </p>
            <p style="margin: 0; font-size: 12px; color: #777;">
              ${reportInfo.Report_date || "Not available"}
            </p>
            <div class="button-container">
              <button id="deny-button-${index}" class="deny-button" data-status="denied">Deny</button>
              <button id="change-status-button-${index}" class="change-status-button" data-status="cleaned">Mark as done</button>
            </div>
          </div>
        `);

        popupReportInfo.on("open", () => {
          const popupElement = popupReportInfo.getElement();
          const buttons = popupElement.querySelectorAll("button");
          const secondButton = buttons[2];
          if (secondButton) {
            secondButton.classList.add("close-button");
          }
        });

        if (pinLat && pinLng) {
          const greenMarker = new maplibregl.Marker({ color: "rgb(0, 193, 47)" })
            .setLngLat([pinLng, pinLat])
            .setPopup(popupReportInfo)
            .addTo(mapInstance);

          greenMarker.getElement().addEventListener("click", () => {
            setGreenPinPopupVisible(true);
          });
        }

        popupReportInfo.on('open', () => {
          const popupElement = popupReportInfo.getElement();
          popupElement.style.zIndex = '10';
        });

        const changeStatusButton = popupReportInfo._content.querySelector(
          `#change-status-button-${index}`
        );
        const denyStatusButton = popupReportInfo._content.querySelector(
          `#deny-button-${index}`
        );

        if (changeStatusButton) {
          changeStatusButton.addEventListener("click", async () => {
            const user = await getCurrentUser();
            const useremail = user.signInDetails.loginId;

            if (reportInfo.Supervisor_email.includes(useremail)) {
              const confirmChange = window.confirm(
                'Are you sure you want to change the status to "cleaned"?'
              );
              if (!confirmChange) {
                return;
              }

              const updatedReports = [...reportLocations];
              updatedReports[index].Report_status = changeStatusButton.dataset.status;
              setReportLocations(updatedReports);
              console.log(changeStatusButton.dataset.status);
              try {
                console.log(reportInfo.Report_status);
                setIsLoading(true);
                await axios.post(
                  process.env.REACT_APP_AWS_APIGATEWAY_ENDPOINT_REPORTSTATUS,
                  {
                    Supervisor_Email: useremail,
                    Report_ID: reportInfo.Report_ID,
                    Report_Status: changeStatusButton.dataset.status
                  },
                  {
                    headers: {
                      'x-api-key': process.env.REACT_APP_AWS_APIGATEWAY_API_KEY,
                    },
                  }
                );

                await axios.post(
                  process.env.REACT_APP_AWS_APIGATEWAY_ENDPOINT_NOTIFICATION_SUPERVISOR,
                  {
                    Report_ID: reportInfo.Report_ID,
                    Report_status: changeStatusButton.dataset.status,
                    Client_email: useremail,
                    Picture: reportInfo.Picture,
                  },
                  {
                    headers: {
                      'x-api-key': process.env.REACT_APP_AWS_APIGATEWAY_API_KEY,
                    },
                  }
                );
              } catch (error) {
                console.error(
                  "Error updating report status in backend:",
                  error
                );
              } finally {
                setIsLoading(false);
              }

              alert("Your work was successful. Students have been notified.");
              window.location.reload();
              const popupContent = popupReportInfo._content;
              if (changeStatusButton.dataset.status === "cleaned") {
                popupContent.style.backgroundColor = "lightgreen";
              }
            } else {
              alert(
                "You are not authorized to change the status of this report."
              );
            }
          });
        }

        if (denyStatusButton) {
          denyStatusButton.addEventListener("click", async () => {
            const user = await getCurrentUser();
            const useremail = user.signInDetails.loginId;

            if (reportInfo.Supervisor_email.includes(useremail)) {
              const confirmChange = window.confirm(
                'Are you sure you want to change the status to "denied"?'
              );
              if (!confirmChange) {
                return;
              }

              const updatedReports = [...reportLocations];
              updatedReports[index].Report_status = denyStatusButton.dataset.status;
              setReportLocations(updatedReports);

              try {
                setIsLoading(true);
                await axios.post(
                  process.env.REACT_APP_AWS_APIGATEWAY_ENDPOINT_REPORTSTATUS,
                  {
                    Supervisor_Email: useremail,
                    Report_ID: reportInfo.Report_ID,
                    Report_Status: denyStatusButton.dataset.status,
                  },
                  {
                    headers: {
                      'x-api-key': process.env.REACT_APP_AWS_APIGATEWAY_API_KEY,
                    },
                  }
                );

                await axios.post(
                  process.env.REACT_APP_AWS_APIGATEWAY_ENDPOINT_NOTIFICATION_SUPERVISOR,
                  {
                    Report_ID: reportInfo.Report_ID,
                    Report_status: denyStatusButton.dataset.status,
                    Client_email: useremail,
                    Picture: reportInfo.Picture,
                  },
                  {
                    headers: {
                      'x-api-key': process.env.REACT_APP_AWS_APIGATEWAY_API_KEY,
                    },
                  }
                );
              } catch (error) {
                console.error(
                  "Error updating report status in backend:",
                  error
                );
              } finally {
                setIsLoading(false);
              }

              alert("The report has been marked as denied.");
              window.location.reload();
              const popupContent = popupReportInfo._content;
              if (denyStatusButton.dataset.status === "denied") {
                popupContent.style.backgroundColor = "lightcoral";
              }
            } else {
              alert(
                "You are not authorized to change the status of this report."
              );
            }
          });
        }
      });
    }
  }, [mapInstance, reportLocations, setGreenPinPopupVisible, isLoading]);

  const placePin = useCallback((lngLat) => { }, []);

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
      // Clean up pin and popup
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

  return (
    <div id="map" style={{ width: "100%", height: "100%" }}>
    {isLoading ? (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          zIndex: 50,
        }}
      >
        <ClipLoader color={"#36D7B7"} loading={isLoading} css={override} size={150} />
      </div>
    ) : (
      <>
        {greenPinPopupVisible && (
          <div>
            Your custom component or message when green pin popup is visible
          </div>
        )}
      </>
    )}
  </div>
  );
};

export default MapFeatures;