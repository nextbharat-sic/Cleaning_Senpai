/* "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved" */

import React, { useEffect, useState } from "react";
import NavigationBar from "./NavigationBar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getCurrentUser } from "@aws-amplify/auth";
import AWS from "aws-sdk";
import "./ComplaintsList.css";
import axios from "axios";
import { faArrowUp, faArrowDown } from "@fortawesome/free-solid-svg-icons";
import { css } from "@emotion/react";
import { ClipLoader } from "react-spinners";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { faShareSquare } from "@fortawesome/free-solid-svg-icons";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

AWS.config.update({
  region: process.env.REACT_APP_AWS_AMAZON_LOCATION_SERVOCE_REGION,
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: process.env.REACT_APP_AWS_IDENTITY_POOL_ID,
  }),
});

const spinnerOverride = css`
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

const ComplaintsList = () => {
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
          report.Supervisor_email.includes(username)
      );
    } else if (filterType === "handled") {
      filteredReports = filteredReports.filter(
        (report) =>
          (report.Report_status === "cleaned" ||
            report.Report_status === "denied") &&
          report.Supervisor_email.includes(username)
      );
    } else {
      filteredReports = filteredReports.filter((report) =>
        report.Supervisor_email.includes(username)
      );
    }

    const sortedReports = sortByDate(filteredReports, sortAscending);

    setReportLocations(sortedReports);
  };

  const changeStatus = async (reportId, newStatus, Picture) => {
    setIsLoading(true);
    const updatedReports = reportLocations.map((report) => {
      if (report.Report_ID === reportId) {
        return { ...report, Report_status: newStatus };
      }
      return report;
    });

    setReportLocations(updatedReports);
    try {
      await axios.post(
        process.env.REACT_APP_AWS_APIGATEWAY_ENDPOINT_REPORTSTATUS,
        {
          Supervisor_Email: username,
          Report_ID: reportId,
          Report_Status: newStatus,
        },
        {
          headers: {
            "x-api-key": process.env.REACT_APP_AWS_APIGATEWAY_API_KEY,
          },
        }
      );
      const useremail = username;
      await axios.post(
        process.env.REACT_APP_AWS_APIGATEWAY_ENDPOINT_NOTIFICATION_SUPERVISOR,
        {
          Report_ID: reportId,
          Report_status: newStatus,
          Client_email: useremail,
          Picture: Picture,
        },
        {
          headers: {
            "x-api-key": process.env.REACT_APP_AWS_APIGATEWAY_API_KEY,
          },
        }
      );
      window.alert("Your work was successful. Students have been notified.");
      window.location.reload();
    } catch (error) {
      console.error("Error updating report status in backend:", error);
    } finally {
      setIsLoading(false);
    }
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
        setUsername(userEmail);

        const userReports = parsedLocations.filter((location) =>
          location.Supervisor_email.includes(userEmail)
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
      const sortedReports = sortByDate([...reportLocations], newSortAscending);

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
        <div className="complaints-list-spinner">
          <ClipLoader
            color={"#36D7B7"}
            loading={true}
            css={spinnerOverride}
            size={150}
          />
        </div>
        <NavigationBar />
      </div>
    );
  }

  const createShareLink = async (report) => {
    await AWS.config.credentials.getPromise();

    const s3 = new AWS.S3({
      region: process.env.REACT_APP_AWS_AMAZON_LOCATION_SERVOCE_REGION,
    });

    const bucketName = process.env.REACT_APP_AWS_AMAZON_S3_BUCKETNAME;
    const fileName = `${report.Report_ID}.jpg`;
    const signedUrlExpireSeconds = 60 * 60 * 48;
    const imageUrl = s3.getSignedUrl("getObject", {
      Bucket: bucketName,
      Key: fileName,
      Expires: signedUrlExpireSeconds,
    });

    const text = `Check out this report:\nID: ${report.Report_ID}\nRegion: ${report.Region}\nDescription: ${report.Description}\nImage URL: ${imageUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const handleShare = async (report) => {
    const shareLink = await createShareLink(report);
    window.open(shareLink, "_blank");
  };

  const CMDShare = async (report) => {
    try {
      setIsLoading(true);
      await axios.post(
        process.env.REACT_APP_AWS_APIGATEWAY_ENDPOINT_NOTIFICATION_DEPARTMENT,
        { Report_ID: report.Report_ID },
        {
          headers: {
            "x-api-key": process.env.REACT_APP_AWS_APIGATEWAY_API_KEY,
          },
        }
      );
      alert("Report has been sent to CMD");
      window.location.reload();
    } catch (error) {
      console.error("Error sending email to CMD:", error);
      alert("Error sending email to CMD. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="complaints-list-container">
      <div className="complaints-list-header">
        <h1 className="complaints-list-title">Complaints List</h1>
        <div className="complaints-list-menu">
          <button
            onClick={() => filterReports("untouched")}
            className={
              activeFilter === "untouched" ? "active" : "default-button"
            }
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
        <div className="complaints-list-sort-menu">
          <button onClick={sortReports}>
            Sort by Date:{" "}
            <FontAwesomeIcon icon={sortAscending ? faArrowDown : faArrowUp} />
          </button>
        </div>
      </div>
      <ul className="complaints-list-report-list">
        {reportLocations.map(
          (location, index) =>
            location.Pin_location?.M?.lat &&
            location.Pin_location?.M?.lng && (
              <li
                key={index}
                className={`complaints-list-report-item ${
                  location.Report_status === "cleaned"
                    ? "complaints-list-status-cleaned"
                    : location.Report_status === "denied"
                    ? "complaints-list-status-denied"
                    : location.Report_status === "untouched"
                    ? "complaints-list-status-untouched"
                    : ""
                }`}
              >
                <div
                  className="complaints-list-thumbnail-container"
                  onClick={() => openModal(location)}
                >
                  <img
                    src={location.Picture}
                    alt="Report"
                    className="complaints-list-thumbnail"
                  />
                  <div className="complaints-list-detail-band">
                    Click to view
                  </div>
                </div>
                <div className="complaints-list-report-details">
                  <div>
                    <p>Time: {location.Picture_timestamp.substring(0, 16)}</p>
                    <p>
                      Report Date: {location.Report_date || "Not available"}
                    </p>
                    <p>Region: {location.Region}</p>
                    <p>
                      Status:{" "}
                      {location.Report_status === "untouched"
                        ? "unhandled"
                        : location.Report_status}
                    </p>
                    <p>Description: {location.Description}</p>
                  </div>
                  <div className="share-button-container">
                    <FontAwesomeIcon
                      icon={faShareSquare}
                      onClick={() => handleShare(location)}
                    />
                  </div>
                  {location.Report_status === "cleaned" && (
                    <div className="complaints-list-task-done-container">
                      <span> Mark as done </span>
                      <div className="complaints-list-check-mark">
                        <FontAwesomeIcon icon={faCheck} />
                      </div>
                    </div>
                  )}

                  {location.Report_status === "denied" && (
                    <div className="complaints-list-task-denied-container">
                      <span> Denied </span>
                      <div className="complaints-list-cross-mark">
                        <FontAwesomeIcon icon={faTimes} />
                      </div>
                    </div>
                  )}

                  {location.Report_status !== "cleaned" &&
                    location.Report_status !== "denied" && (
                      <div className="complaints-list-task-done-container">
                        <div className="complaints-list-buttons-group">
                          <button
                            className="complaints-list-deny-button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Are you sure you want to deny this report?"
                                )
                              ) {
                                changeStatus(
                                  location.Report_ID,
                                  "denied",
                                  location.Picture
                                );
                              }
                            }}
                          >
                            Deny
                          </button>
                          <button
                            className="complaints-list-cmd-button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Are you sure you want to send this report to CMD?"
                                )
                              ) {
                                CMDShare(location);
                              }
                            }}
                          >
                            CMD
                          </button>
                        </div>
                        <button
                          className="complaints-list-change-status-text"
                          onClick={() => {
                            if (
                              window.confirm(
                                "Are you sure you want to change the status to cleaned?"
                              )
                            ) {
                              changeStatus(
                                location.Report_ID,
                                "cleaned",
                                location.Picture
                              );
                            }
                          }}
                        >
                          Mark as done
                        </button>
                      </div>
                    )}
                </div>
              </li>
            )
        )}
      </ul>
      {selectedReport && (
        <div className="complaints-list-modal" onClick={handleModalClick}>
          <div className="complaints-list-modal-content">
            <img
              src={selectedReport.Picture}
              alt="Report"
              className="complaints-list-full-image"
            />
          </div>
        </div>
      )}
      <NavigationBar />
    </div>
  );
};
export default ComplaintsList;