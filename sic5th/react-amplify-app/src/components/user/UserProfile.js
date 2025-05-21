/* "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved" */

import React, { useState, useEffect } from "react";
import axios from "axios";
import { getCurrentUser, signOut as amplifySignOut } from "aws-amplify/auth";
import NavigationBarUser from "./NavigationBar";
import "./UserProfile.css";
import { css } from "@emotion/react";
import { ClipLoader } from "react-spinners";

const userLoaderOverride = css`
  display: block;
  margin: 0 auto;
  border-color: #36d7b7;
`;

const UserProfilePage = ({ signOut: propSignOut }) => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const NavigationBar = NavigationBarUser;

  const handleUserSignOut = async () => {
    try {
      await amplifySignOut();
      setUserData(null);
      localStorage.setItem("opening", JSON.stringify(true));
      propSignOut();
    } catch (error) {
      console.error("Error signing out (User):", error);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const user = await getCurrentUser();
        const userId = user.signInDetails.loginId;
        const userType = "user";

        const apiEndpoint =
          process.env.REACT_APP_AWS_APIGATEWAY_ENDPOINT_PROFILE;
        const response = await axios.get(apiEndpoint, {
          params: { userId, userType },
          headers: {
            "x-api-key": process.env.REACT_APP_AWS_APIGATEWAY_API_KEY,
          },
        });
        setUserData(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  if (isLoading) {
    return (
      <div
        className="user-profile-page-container"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <NavigationBar />
        <div className="history-spinner">
          <ClipLoader
            color={"#36D7B7"}
            loading={true}
            css={userLoaderOverride}
            size={150}
          />
        </div>
      </div>
    );
  }  

  const renderUserProfileItems = () => {
    if (!userData) return null;

    return (
      <>
        <div className="user-profile-item">
          <label>Username:</label>
          <span>{userData.username}</span>
        </div>
        <div className="user-profile-item">
          <label>E-mail:</label>
          <span>{userData.email}</span>
        </div>
      </>
    );
  };

  const renderUserAdditionalSection = () => {
    return (
      <>
        <div className="user-contact-section">
          <h2>For app issues, please contact us</h2>
          <div className="user-profile-item">
            <label>Developer:</label>
            <span>agile5th@nextbharat.ventures</span>
          </div>
        </div>

        <div className="user-feedback-section">
          <h2>How is your experience using this app?</h2>
          <button
            className="user-feedback-button"
            onClick={() =>
              window.open(
                "https://docs.google.com/forms/d/e/1FAIpQLSdCkA8KZ8P-Oq-9sOOAJe_kNYbPF1kNwH8NWsRhlGrs50CMMA/viewform?usp=header",
                "_blank"
              )
            }
          >
            Send Feedback!
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="user-profile-page-container">
      <NavigationBar />
       <div className="user-profile-header">
        <h1 className="user-profile-title">Profile</h1>
      </div>
      <div className="user-profile-section">
        {renderUserProfileItems()}
      </div>
      {renderUserAdditionalSection()}
      <div className="user-logout-button-container">
        <button className="user-logout-button" onClick={handleUserSignOut}>
          Logout
        </button>
      </div>
      <NavigationBar />
    </div>
  );
};

const UserProfileComponent = (props) => <UserProfilePage {...props} />;

export default UserProfileComponent;