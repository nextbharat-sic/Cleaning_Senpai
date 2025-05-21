/* "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved" */

import React, { forwardRef } from "react";
import { NavLink } from "react-router-dom";
import "./NavigationBar.css";

const NavigationBar = forwardRef((props, ref) => {
  return (
    <nav className="navbar" ref={ref}>
      <NavLink
        to="/homeuser"
        className={({ isActive }) => (isActive ? "active" : "")}
      >
        <div className="nav-icon-container">
          <i className="fas fa-home"></i>
          <span>Home</span>
        </div>
      </NavLink>
      <NavLink
        to="/historyuser"
        className={({ isActive }) => (isActive ? "active" : "")}
      >
        <div className="nav-icon-container">
          <i className="fas fa-history"></i>
          <span>History</span>
        </div>
      </NavLink>
      <NavLink
        to="/profileuser"
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