/* "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved" */

import React, { forwardRef } from "react";
import { NavLink } from "react-router-dom";
import "./NavigationBar.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFrown } from '@fortawesome/free-solid-svg-icons'

const NavigationBar = forwardRef((props, ref) => {
  return (
    <nav className="navbar" ref={ref}>
      <NavLink
        to="/homesupervisor"
        className={({ isActive }) => (isActive ? "active" : "")}
      >
        <div className="nav-icon-container">
          <i className="fas fa-home"></i>
          <span>Home</span>
        </div>
      </NavLink>
      <NavLink
        to="/complaintslistsupervisor"
        className={({ isActive }) => (isActive ? "active" : "")}
      >
        <div className="nav-icon-container">
          <FontAwesomeIcon icon={faFrown} />
          <span>Complaints</span>
        </div>
      </NavLink>
      <NavLink
        to="/profilesupervisor"
        className={({ isActive }) => (isActive ? "active" : "")}
      >
        <div className="nav-icon-container">
          <i className="fas fa-user"></i>
          <span>Profile</span>
        </div>
      </NavLink>
    </nav>
  );
});

export default NavigationBar;