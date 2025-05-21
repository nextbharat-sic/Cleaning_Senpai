/* "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved" */

import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import "./SupervisorSelection.css";

const SupervisorSelection = () => {
  const navigate = useNavigate();
  const [useremail, setUseremail] = useState("");
  useEffect(() => {
    const storedEmail = localStorage.getItem("useremail");
    if (storedEmail) {
      setUseremail(storedEmail);
    }
  }, []);

  const handleUserClick = async () => {
    try {
      const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
      if (hasSeenOnboarding === null) {
        const response = await axios.get(
          process.env.REACT_APP_AWS_APIGATEWAY_ENDPOINT_ONBOADRING,
          {
            params: {
              useremail: useremail,
            },
            headers: {
              "x-api-key": process.env.REACT_APP_AWS_APIGATEWAY_API_KEY,
            },
          }
        );
        const hasSeenOnboardingFromDB = response.data.hasSeenOnboarding;
        if (hasSeenOnboardingFromDB) {
          navigate("/homeuser");
        } else {
          navigate("/Onboarding");
        }
      } else {
        if (hasSeenOnboarding === "false") {
          navigate("/Onboarding");
        } else {
          navigate("/homeuser");
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  return (
    <div className="supervisor-container">
      <div className="supervisor-buttons">
        <button
          className="supervisor-button"
          onClick={() => navigate("/homesupervisor")}
        >
          SUPERVISOR
        </button>
        <button className="supervisor-button" onClick={handleUserClick}>
          USER
        </button>
      </div>
    </div>
  );
};

export default SupervisorSelection;