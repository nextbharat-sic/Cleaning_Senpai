/* "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved" */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Onboarding.css";
import { getCurrentUser } from "@aws-amplify/auth";
import axios from 'axios';

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  
  const steps = [
    {
      title: "Select the location",
      description:
        "Select the location on the map. If you can't find the exact location, you may choose the nearest location.",
      image: "/images/location.png",
    },
    {
      title: "Click the picture",
      description:
        "Take a picture of the litter, overflowing trash, or the issue you want to report.",
      image: "/images/camera.png",
    },
    {
      title: "Write the issue and enter the landmark",
      description:
        "After clicking the picture, you can enter the issue and location landmark.",
      image: "/images/landmark.png",
    },
    {
      title: "Send the complaint",
      description: "Supervisor will receive the complaint and solve the issue.",
      image: "/images/complaint.png",
    },
    {
      title: "Tap and view other complaints",
      description: "Tap on the green landmark to view complaints by other users",
      image: "/images/tap.png"
    }
  ];

  
  
  const nextStep = async () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      const user = await getCurrentUser();
      const useremail = user.signInDetails.loginId;
      await axios.put(process.env.REACT_APP_AWS_APIGATEWAY_ENDPOINT_ONBOADRING, {
        useremail: useremail,
      },
      {
        headers: {
          'x-api-key': process.env.REACT_APP_AWS_APIGATEWAY_API_KEY,
        },
      });
      navigate("/homeuser");
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <div className="onboarding-container">
    <div className="imagebox">
      <img src={steps[step].image} alt={steps[step].title} />
      <h2>{steps[step].title}</h2>
      <p>{steps[step].description}</p>
    </div>
      <div className="navigation-buttons">
        {step > 0 && <button onClick={prevStep}>Back</button>}
        <button onClick={nextStep}>
          {step === steps.length - 1 ? "Finish!" : "Next"}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;