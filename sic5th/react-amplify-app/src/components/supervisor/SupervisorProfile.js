/* "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved" */

import React, { useState, useEffect } from "react";
import axios from "axios";
import { getCurrentUser, signOut as amplifySignOut } from "aws-amplify/auth";
import NavigationBarSupervisor from "./NavigationBar";
import "./SupervisorProfile.css";
import { css } from "@emotion/react";
import { ClipLoader } from "react-spinners";

const supervisorLoaderOverride = css`
  display: block;
  margin: 0 auto;
  border-color: #36d7b7;
`;

const SupervisorProfilePage = ({ signOut: propSignOut }) => {
  const [supervisorData, setSupervisorData] = useState(null);
  const [isSupervisorLoading, setIsSupervisorLoading] = useState(true);
  const [isSupervisorDataFetched, setIsSupervisorDataFetched] = useState(false);

  const handleSupervisorSignOut = async () => {
    try {
      await amplifySignOut();
      setSupervisorData(null);
      setIsSupervisorDataFetched(false);
      propSignOut();
    } catch (error) {
      console.error("Error signing out (Supervisor):", error);
    }
  };

  useEffect(() => {
    const fetchSupervisorData = async () => {
      setIsSupervisorLoading(true);
      try {
        const user = await getCurrentUser();
        const userId = user.signInDetails.loginId;
        const userType = "supervisor";

        if (isSupervisorDataFetched) {
          setIsSupervisorLoading(false);
          return;
        }

        const apiEndpoint =
          process.env.REACT_APP_AWS_APIGATEWAY_ENDPOINT_PROFILE;
        const response = await axios.get(apiEndpoint, {
          params: { userId, userType },
          headers: {
            "x-api-key": process.env.REACT_APP_AWS_APIGATEWAY_API_KEY,
          },
        });

        setSupervisorData(response.data);
        setIsSupervisorDataFetched(true);
      } catch (error) {
        console.error("Error fetching supervisor data:", error);
      } finally {
        setIsSupervisorLoading(false);
      }
    };

    fetchSupervisorData();
  }, [isSupervisorDataFetched]);

  if (isSupervisorLoading) {
    return (
      <div className="complaints-list-container">
        <NavigationBarSupervisor />
        <div className="complaints-list-spinner">
          <ClipLoader
            color={"#36D7B7"}
            loading={true}
            css={supervisorLoaderOverride}
            size={150}
          />
        </div>
    </div>
    );
  }

  const renderSupervisorProfileItems = () => {
    if (!supervisorData) return null;

    return (
      <>
        <div className="supervisor-profile-item">
          <label>Username:</label>
          <span>{supervisorData.username}</span>
        </div>
        <div className="supervisor-profile-item">
          <label>E-mail:</label>
          <span>{supervisorData.email}</span>
        </div>
        <div className="supervisor-profile-item">
          <label>Region:</label>
          <div className="supervisor-region-item">
            <span>
              {Array.isArray(supervisorData.Region)
                ? supervisorData.Region.join(", ")
                : ""}
            </span>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="complaints-list-container">
      <div className="complaints-list-header">
        <h1 className="complaints-list-title">Profile</h1>
      </div>

      <div className="supervisor-profile-section">{renderSupervisorProfileItems()}</div>

      <div className="supervisor-logout-button-container">
        <button className="supervisor-logout-button" onClick={handleSupervisorSignOut}>
          Logout
        </button>
      </div>
      <NavigationBarSupervisor />
    </div>
  );
};

const SupervisorProfileComponent = (props) => (
  <SupervisorProfilePage {...props}  />
);

export default SupervisorProfileComponent;