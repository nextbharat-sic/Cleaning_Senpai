/* "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved" */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, signOut } from "@aws-amplify/auth";

import axios from "axios";

function Home() {
  const navigate = useNavigate();
  const [unauthorized, setUnauthorized] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await getCurrentUser();
        const useremail = user.signInDetails.loginId;
        localStorage.setItem("useremail", useremail);
        const supervisor_present = async (useremail) => {
          try {
            const response = await axios.get(
              process.env.REACT_APP_AWS_APIGATEWAY_ENDPOINT_SUPERVISOR,
              {
                params: { useremail: useremail },
                headers: {
                  "x-api-key": process.env.REACT_APP_AWS_APIGATEWAY_API_KEY,
                },
              }
            );

            const exists = response.data.exists;
            return exists;
          } catch (error) {
            console.error("Error fetching data from API Gateway:", error);
            return false;
          }
        };

        const isUserInDynamodb = await supervisor_present(useremail);

        if (isUserInDynamodb) {
          navigate("/supervisorselection");
        } else {
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
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUnauthorized(true);
        setErrorMessage("An error occurred while fetching user data.");
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.log("Error signing out: ", error);
    }
  };

  return (
    <div>
      {unauthorized && (
        <div>
          <p>{errorMessage}</p>
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      )}
    </div>
  );
}

export default Home;