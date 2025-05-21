/* "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved" */

import React, { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import NavigationBarUser from "./NavigationBar";
import "./WebcamCapture.css";
import { css } from "@emotion/react";
import { ClipLoader } from "react-spinners";

const override = css`
  display: block;
  margin: 0 auto;
  border-color: #36d7b7;
`;

const WebcamCapture = ({ user }) => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [description, setDescription] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSendButtonDisabled, setIsSendButtonDisabled] = useState(false);
  const webcamRef = useRef(null);
  const navigate = useNavigate();

  const coordinates = JSON.parse(localStorage.getItem("coordinates"));
  const apiEndpoint_complaint =
    process.env.REACT_APP_AWS_APIGATEWAY_ENDPOINT_COMPLAINT;
  const apiEndpoint_region =
    process.env.REACT_APP_AWS_APIGATEWAY_ENDPOINT_REGION;

  const handleCapture = useCallback(() => {
    if (!coordinates) {
      console.error("Error: No coordinate data found.");
      alert("Error: No coordinate data found.");
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      console.error("Error: Could not capture image.");
      return;
    }

    setCapturedImage(imageSrc);
  }, [webcamRef, coordinates]);

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleDescriptionChange = (event) => {
    setDescription(event.target.value);
  };

  const handleSendReport = async () => {
    setIsSending(true);
    setIsSendButtonDisabled(true);
    const response = await sendToLambda(
      capturedImage,
      coordinates,
      description,
      user
    );

    if (response.success) {
      navigate("/completeduser", { state: response.data });
    } else {
      console.log("Transmission failed, please try again");
      navigate("/");
    }
    setIsSending(false);
    setIsSendButtonDisabled(false);
  };

  const sendToLambda = async (imageSrc, coordinates, description, user) => {
    const userEmail = user.user.signInDetails.loginId;

    let reportResponse;
    try {
      reportResponse = await axios.post(
        apiEndpoint_complaint,
        {
          image: imageSrc,
          userLat: coordinates.pin.lat,
          userLng: coordinates.pin.lng,
          description: description,
          useremail: userEmail,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_AWS_APIGATEWAY_API_KEY,
          },
        }
      );
    } catch (error) {
      console.error("Error in report request:", error.message);
      alert("Failed to send report.");
      return false;
    }

    localStorage.setItem("reportId", reportResponse.data.item.Report_ID);
    const reportId = reportResponse.data.item.Report_ID;

    let regionResponse;
    try {
      regionResponse = await axios.post(
        apiEndpoint_region,
        {
          reportId: reportId,
          userLat: coordinates.pin.lat,
          userLng: coordinates.pin.lng,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_AWS_APIGATEWAY_API_KEY,
          },
        }
      );
    } catch (error) {
      console.error("Error in region request:", error.message);
      alert("Failed to fetch region information.");
      return false;
    }

    const regionStr = regionResponse.data.geofences;

    try {
      await axios.post(
        process.env.REACT_APP_AWS_APIGATEWAY_ENDPOINT_NOTIFICATION,
        {
          Report_ID: reportId,
          Report_status: "untouched",
          Client_email: userEmail,
          Region: regionStr,
          Picture: imageSrc,
          PinLat: coordinates.pin.lat,
          PinLng: coordinates.pin.lng,
        },
        {
          headers: {
            "x-api-key": process.env.REACT_APP_AWS_APIGATEWAY_API_KEY,
          },
        }
      );
    } catch (error) {
      console.error("Error in notification request:", error.message);
      alert("Failed to send notification.");
      return false;
    }

    return { success: true, data: reportResponse.data };
  };

  return (
    <div className="webcam-capture-container">
      {!capturedImage && (
        <div className="camera-container">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={400}
            videoConstraints={{ facingMode: "environment" }}
          />
          <div className="buttons-container">
            <button onClick={handleCapture} className="capture-button">
              Capture Photo
            </button>
          </div>
        </div>
      )}

      {capturedImage && (
        <div className="captured-photo-container">
          <div className="image-preview-wrapper">
            <img src={capturedImage} alt="Captured" className="preview-image" />
          </div>
          <div className="buttons-container">
            <button onClick={handleRetake} className="retake-button">
              Retake
            </button>
          </div>
          <textarea
            id="description"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Enter description (optional)"
          />
          <div className="send-report-container">
            <button
              onClick={handleSendReport}
              className="send-report-button"
              disabled={isSendButtonDisabled}
            >
              Send Report!!
            </button>
          </div>
          {isSending && (
            <div className="loading-spinner">
              <ClipLoader
                color={"#36D7B7"}
                loading={true}
                css={override}
                size={60}
              />
            </div>
          )}
        </div>
      )}
      <NavigationBarUser />
    </div>
  );
};

export default WebcamCapture;