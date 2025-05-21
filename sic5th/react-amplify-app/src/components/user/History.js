/* "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved" */

import React, { useEffect, useState } from "react";
import NavigationBarUser from "./NavigationBar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getCurrentUser } from "@aws-amplify/auth";
import "./History.css";
import axios from "axios";
import { faArrowUp, faArrowDown } from "@fortawesome/free-solid-svg-icons";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { css } from "@emotion/react";
import { ClipLoader } from "react-spinners";
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const override = css`
  display: block;
  margin: 0 auto;
  border-color: #36d7b7;
`;

const sortByDate = (reports, newSortAscending) => {
  return reports.sort((a, b) => {
    if (
      (a.Report_status === "cleaned" || a.Report_status === "denied") &&
      b.Report_status !== "cleaned" &&
      b.Report_status !== "denied"
    ) {
      return 1;
    } else if (
      a.Report_status !== "cleaned" &&
      a.Report_status !== "denied" &&
      (b.Report_status === "cleaned" || b.Report_status === "denied")
    ) {
      return -1;
    } else {
      return newSortAscending
        ? a.Picture_timestamp.localeCompare(b.Picture_timestamp)
        : b.Picture_timestamp.localeCompare(a.Picture_timestamp);
    }
  });
};

const History = () => {
  const [reportLocations, setReportLocations] = useState([]);
  const [sortAscending, setSortAscending] = useState(true);
  const [originalReports, setOriginalReports] = useState([]);
  const [username, setUsername] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  const filterReports = (filterType) => {
    setActiveFilter(filterType);
    let filteredReports = [...originalReports];

    if (filterType === "untouched") {
      filteredReports = filteredReports.filter(
        (report) =>
          report.Report_status === "untouched" &&
          report.Student_email === username
      );
    } else if (filterType === "handled") {
      filteredReports = filteredReports.filter(
        (report) =>
          (report.Report_status === "cleaned" ||
            report.Report_status === "denied") &&
          report.Student_email === username
      );
    } else {
      filteredReports = filteredReports.filter(
        (report) => report.Student_email === username
      );
    }
    
    const sortedReports = sortByDate(filteredReports, sortAscending)
  
    setReportLocations(sortedReports);
  };

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      const user = await getCurrentUser();
      const userEmail = user.signInDetails.loginId;
      try {
        const response = await axios.get(
          process.env.REACT_APP_AWS_APIGATEWAY_ENDPOINT_COMPLAINT,
          {
            params: {
              useremail: userEmail,
            },
            headers: {
              "x-api-key": process.env.REACT_APP_AWS_APIGATEWAY_API_KEY,
            },
          }
        );
        const parsedLocations = response.data;
        const currentUser = await getCurrentUser();
        const username = currentUser.signInDetails.loginId;
        setUsername(username);

        const userReports = parsedLocations.filter(
          (location) => location.Student_email === username
        );
        const uniqueReports = Array.from(
          new Set(userReports.map((report) => report.Report_ID))
        ).map((id) => userReports.find((report) => report.Report_ID === id));

        const sortedReports = uniqueReports.sort((a, b) => {
          if (
            (a.Report_status === "cleaned" || a.Report_status === "denied") &&
            b.Report_status !== "cleaned" &&
            b.Report_status !== "denied"
          ) {
            return 1;
          } else if (
            a.Report_status !== "cleaned" &&
            a.Report_status !== "denied" &&
            (b.Report_status === "cleaned" || b.Report_status === "denied")
          ) {
            return -1;
          } else {
            return a.Picture_timestamp.localeCompare(b.Picture_timestamp);
          }
        });

        setOriginalReports(parsedLocations);
        setReportLocations(sortedReports);
      } catch (error) {
        console.error("Error fetching reports from API:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  const sortReports = () => {
    setSortAscending((prevSortAscending) => {
      const newSortAscending = !prevSortAscending;
      const sortedReports = sortByDate([...reportLocations], newSortAscending)

      setReportLocations(sortedReports);
      return newSortAscending;
    });
  };

  const openModal = (report) => {
    setSelectedReport(report);
  };

  const handleModalClick = (e) => {
    if (e.target === e.currentTarget) {
      setSelectedReport(null);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
        }}
      >
        <div className="history-spinner">
          <ClipLoader
            color={"#36D7B7"}
            loading={true}
            css={override}
            size={150}
          />
        </div>
        <NavigationBarUser />
      </div>
    );
  }  

  return (
    <div className="history-container">
      <div className="history-header">
        <h1>Complaints History</h1>
        <div className="history-menu">
          <button
            onClick={() => filterReports("untouched")}
            className={activeFilter === "untouched" ? "active" : "default-button"}
          >
            Unhandled
          </button>
          <button
            onClick={() => filterReports("handled")}
            className={activeFilter === "handled" ? "active" : "default-button"}
          >
            Handled
          </button>
          <button
            onClick={() => filterReports("all")}
            className={activeFilter === "all" ? "active" : "default-button"}
          >
            All Reports
          </button>
        </div>
        <div className="history-sort-menu">
          <button onClick={sortReports}>
            Sort by Date:{" "}
            <FontAwesomeIcon icon={sortAscending ? faArrowDown : faArrowUp} />
          </button>
        </div>
      </div>
      <ul className="history-report-list">
        {reportLocations.map(
          (location, index) =>
            location.Pin_location?.M?.lat &&
            location.Pin_location?.M?.lng && (
              <li
                key={index}
                className={`history-report-item ${
                  location.Report_status === "cleaned"
                    ? "history-status-cleaned"
                    : location.Report_status === "denied"
                    ? "history-status-denied"
                    : location.Report_status === "untouched"
                    ? "history-status-untouched"
                    : ""
                }`}
              >
                <div
                  className="history-thumbnail-container"
                  onClick={() => openModal(location)}
                >
                  <img
                    src={location.Picture}
                    alt="Report"
                    className="history-thumbnail"
                  />
                  <div className="history-detail-band">Click to view</div>
                </div>
                <div className="history-report-details">
                  <p>Time: {location.Picture_timestamp.substring(0, 16)}</p>
                  <p>
                    Report Date: {location.Report_date || "Not available"}
                  </p>
                  <p>Region: {location.Region}</p>
                  <p>Status: {location.Report_status === 'untouched' ? 'unhandled' : location.Report_status}</p>
                  <p>Description: {location.Description}</p>
                  {location.Report_status === "cleaned" && (
                    <div className="history-task-done-container">
                      <span>Cleaned</span>
                      <div className="history-check-mark">
                        <FontAwesomeIcon icon={faCheck} />
                      </div>
                    </div>
                  )}
                  {location.Report_status === "denied" && (
                    <div className="history-task-denied-container">
                      <span>Denied</span>
                      <div className="history-cross-mark">
                        <FontAwesomeIcon icon={faTimes} />
                      </div>
                    </div>
                  )}
                </div>
              </li>
            )
        )}
      </ul>

      {selectedReport && (
        <div className="history-modal" onClick={handleModalClick}>
          <div className="history-modal-content">
            <img
              src={selectedReport.Picture}
              alt="Report"
              className="history-full-image"
            />
          </div>
        </div>
      )}
      <NavigationBarUser />
    </div>
  );
};

export default History;