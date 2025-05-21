/* "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved" */

import React, { useState, useEffect, useReducer, useRef, useCallback } from "react";
import "./SupervisorNotification.css";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faTimes,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { getCurrentUser } from "@aws-amplify/auth";

function Notification({ map }) {
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [showNotificationBar, setShowNotificationBar] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const notificationMenuRef = useRef(null);

  const fetchNotifications = async (userEmail) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_AWS_APIGATEWAY_ENDPOINT_NOTIFICATION_SUPERVISOR}?supervisorEmail=${userEmail}`,
        {
          headers: {
            'x-api-key': process.env.REACT_APP_AWS_APIGATEWAY_API_KEY,
          },
        }
      );

      if(response.data.notifications){
        const notificationsData = response.data.notifications
        .map(response_item => ({
          Supervisor_Notification_ID: response_item.Supervisor_Notification_ID.N,
          message: response_item.message.S,
          Report_ID: response_item.Report_ID.N,
          is_read: response_item.is_read.BOOL,
          Notification_type: response_item.Notification_type.S,
          Notified_time: response_item.Notified_time.N,
          Report_status: response_item.Report_status.S,
          Supervisor_email: response_item.Supervisor_email.S,
          Pin_locaiton: response_item.Coordinates,
          Picture: response_item.Picture.S,
        }))
        .reverse();

        setNotifications(notificationsData);

        if (notificationsData.length > 0) {
          setHasNewNotification(true);
          setShowNotificationBar(true);
        } else {
          setHasNewNotification(false);
          setShowNotificationBar(false);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    const getUserEmail = async () => {
      try {
        const user = await getCurrentUser();
        const email = user.signInDetails.loginId;
        fetchNotifications(email);
       
      } catch (err) {
        console.log("Error getting current user:", err);
      }
    };

    getUserEmail();
  }, []);

  const handleNotificationClick = () => {
    //use SetTimeOut not to open the menu after before close the menu
    setTimeout(() => {
      setShowNotificationMenu(true);
      setShowNotificationBar(false);
      setHasNewNotification(false);
    }, 100);
  };

  const closeNotificationBar = (event) => {
    event.stopPropagation();
    setShowNotificationBar(false);
  };

  const closeNotificationMenu = () => {
    const notificationMenu = document.querySelector('.notification-menu');
    notificationMenu.classList.add('hide');

    setTimeout(() => {
      setShowNotificationMenu(false);
      notificationMenu.classList.remove('hide');
    }, 500);
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_AWS_APIGATEWAY_ENDPOINT_NOTIFICATION_SUPERVISOR}?notificationId=${notificationId}`,
        {
          headers: {
            'x-api-key': process.env.REACT_APP_AWS_APIGATEWAY_API_KEY,
          },
        }
      );
      if (response.status === 200) {
        setNotifications(prevNotifications =>
          prevNotifications.filter(notification => notification.Supervisor_Notification_ID !== notificationId)
        );
        forceUpdate();
      } else {
        console.error("Failed to delete notification:", response);
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const moveToReport = (location) => {
    setShowNotificationMenu(false);
  
    map.flyTo({
      center: [location.L[1].N, location.L[0].N],
      zoom: 17,
      essential: true,
      speed: 0.5,
      curve: 1,
    });
  
    map.once('moveend', () => {
      if (map.getLayer('aoi-circle')) {
        map.removeLayer('aoi-circle');
        map.removeSource('aoi-circle');
      }
  
      map.addSource('aoi-circle', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [location.L[1].N, location.L[0].N],
              },
              properties: {},
            },
          ],
        },
      });
  
      map.addLayer({
        id: 'aoi-circle',
        type: 'circle',
        source: 'aoi-circle',
        paint: {
          'circle-radius': 10,
          'circle-color': '#FF5733',
          'circle-opacity': 0.6,
        },
      });
    });
  
    const handleMapClick = (e) => {
      const features = map.queryRenderedFeatures(e.point);
      const isMarkerClicked = features.some(feature => feature.layer.id === 'your-marker-layer-id');
  
      if (!isMarkerClicked) {
        if (map.getLayer('aoi-circle')) {
          map.removeLayer('aoi-circle');
          map.removeSource('aoi-circle');
        }
      }
    };
  
    map.once('click', handleMapClick);
  };

  const handleScreenClick = useCallback((event) => {
    if (showNotificationMenu && notificationMenuRef.current) {
      const menuRect = notificationMenuRef.current.getBoundingClientRect();
      const isInsideMenu = 
        event.clientX >= menuRect.left &&
        event.clientX <= menuRect.right &&
        event.clientY >= menuRect.top &&
        event.clientY <= menuRect.bottom;

        if (!isInsideMenu) {
          closeNotificationMenu();
        }
    }
  }, [showNotificationMenu]) 

  useEffect(() => {
    document.addEventListener('click', handleScreenClick);

    return () => {
      document.removeEventListener('click', handleScreenClick);
    };
  }, [handleScreenClick]);

  const deleteAllNotifications = () => {
    if (notifications.length > 0) {
      if (window.confirm("Are you sure you want to delete all notifications?")) {
        notifications.forEach((notification) => {
          deleteNotification(notification.Supervisor_Notification_ID);
        })
      }
    }
  }
  
  return (
    <div className="outer-container">
      <div className="image-container">
        <img
          src="/images/CleaningSENPAI Horizontal.png"
          alt="Cleaning SENPAI Logo"
          className="senpai-logo"
        />
      </div>
      <div className="notification-container">
        <button className="notification-button" onClick={handleNotificationClick}>
          <FontAwesomeIcon icon={faBell} className="icons" />
          {hasNewNotification && <span className="new-notification-dot"></span>}
        </button>

        {showNotificationBar && (
          <div
            className={`notification-bar ${showNotificationBar ? "" : "hide"}`}
            onClick={handleNotificationClick}
          >
            <FontAwesomeIcon icon={faBell} className="bar-icon" />
            <span className="notification-message">New notification!</span>
            <button className="close-bar-button" onClick={closeNotificationBar}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        )}

        {showNotificationMenu && (
          <div
            className={`notification-menu ${showNotificationMenu ? "" : "hide"}`}
            ref={notificationMenuRef}
          >
            
          <div className="user-notification-menu-header">
            <h2>Notifications</h2>
            <FontAwesomeIcon icon={faTrash} className="user-trash-button" onClick={deleteAllNotifications} />
          </div>
            <ul 
              className="notification-list"
            >
              {notifications.map((notification) => (
                <li
                  key={notification.Supervisor_Notification_ID}
                  className="notification-item"
                  onClick={() => moveToReport(notification.Pin_locaiton)}
                >
                  <button
                    className="close-item-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteNotification(notification.Supervisor_Notification_ID);
                    }}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                  <div className="notification-content">
                    <p>
                      <b>Notification ID:</b> {notification.Supervisor_Notification_ID}
                      <span className="notification-dot"></span>
                    </p>
                    <p>{notification.message}</p>
                    {notification.Picture && (
                      <img
                        src={notification.Picture}
                        alt="Report"
                        className="notification-image"
                        style={{ width: '100%' }} 
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default Notification;