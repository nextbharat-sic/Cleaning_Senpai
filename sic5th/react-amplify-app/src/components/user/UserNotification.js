/* "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved" */

import React, { useState, useEffect, useRef, useCallback } from "react";
import "./UserNotification.css";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faTimes,
  faCheck,
  faTrash
} from "@fortawesome/free-solid-svg-icons";
import { getCurrentUser } from "@aws-amplify/auth";

function Notification() {
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [showNotificationBar, setShowNotificationBar] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationMenuRef = useRef(null);

  const fetchNotifications = async (userEmail) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_AWS_APIGATEWAY_ENDPOINT_NOTIFICATION}?studentEmail=${userEmail}`,
        {
          headers: {
            'x-api-key': process.env.REACT_APP_AWS_APIGATEWAY_API_KEY,
          },
        }
      );

      if (response.data.notifications) {
        const notificationsData = response.data.notifications;
        setNotifications(notificationsData.reverse());

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
    setTimeout(() => {
      setShowNotificationMenu(true);
      setShowNotificationBar(false);
      setHasNewNotification(false);
    }, 100)
    
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
        `${process.env.REACT_APP_AWS_APIGATEWAY_ENDPOINT_NOTIFICATION}?notificationId=${notificationId}`,
        {
          headers: {
            'x-api-key': process.env.REACT_APP_AWS_APIGATEWAY_API_KEY,
          },
        }
      );

      if (response.status === 200) {
        setNotifications((prevNotifications) =>
          prevNotifications.filter(
            (notification) => notification.Notification_ID.N !== notificationId
          )
        );
      } else {
        console.error("Failed to delete notification:", response);
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
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
  },[showNotificationMenu])
  
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
          deleteNotification(notification.Notification_ID.N);
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
          ref={notificationMenuRef}
          className={`notification-menu ${showNotificationMenu ? "" : "hide"}`}
        >
          <div className="user-notification-menu-header">
            <h2>Notifications</h2>
            <FontAwesomeIcon icon={faTrash} className="user-trash-button" onClick={deleteAllNotifications} />
          </div>
          <ul className="notification-list">
            {notifications.map((notification) => (
              <li
                key={notification.Notification_ID.N}
                className="notification-item"
              >
                <button
                  className="close-item-button"
                  onClick={() =>
                    deleteNotification(notification.Notification_ID.N)
                  }
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
                <div className="notification-content">
                  <p>
                    <b>Notification ID:</b> {notification.Notification_ID.N}
                  </p>
                  <p>
                    {notification.message.S}
                    {notification.message.S === "Got cleaned!" && (
                      <FontAwesomeIcon icon={faCheck} className="check-icon" style={{ color: 'green', marginLeft: '5px' }} />
                    )}
                  </p>
                  {notification.Picture && (
                    <img
                      src={notification.Picture.S}
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