/* "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved" */

import React from "react";
import NavigationBarUser from "./NavigationBar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons"; 
import "./Completed.css";

const Completed = () => {

  const reportId = localStorage.getItem("reportId");

  const SendToFeedback = () => {
    window.open(
      "https://docs.google.com/forms/d/e/1FAIpQLSdCkA8KZ8P-Oq-9sOOAJe_kNYbPF1kNwH8NWsRhlGrs50CMMA/viewform?usp=header",
      "_blank"
    );
  };

  return (
    <div className="container">
      <h1 className="title">
        Submission Complete!
      </h1>
      <div className="icon-container">
        <FontAwesomeIcon icon={faCheckCircle} className="icon" />
      </div>
      <div className="report-info">
        <p className="report-id-text">
          Report ID: <strong>{reportId}</strong>
        </p>
        <p className="message-text">Cleaning SENPAI will take the action...</p>
      </div>


      <div className="feedback-section">
        <h2>How is your experience using this app?</h2>
        <button className="feedback-button" onClick={SendToFeedback}>
          Send Feedback!
        </button>
      </div>

      <div className="nav-container">
        <NavigationBarUser />
      </div>
    </div>
  );
};

export default Completed;