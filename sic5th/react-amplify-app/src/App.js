/* "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved" */

import React, {useEffect} from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { Amplify } from "aws-amplify";
import { withAuthenticator } from "@aws-amplify/ui-react";
import { signOut } from "@aws-amplify/auth";
import "@aws-amplify/ui-react/styles.css";
import awsExports from "./aws-exports";
import Home from "./components/Home";
import HomeUser from "./components/user/UserHome";
import WebcamCaptureUser from "./components/user/WebcamCapture";
import CompletedUser from "./components/user/Completed";
import HistoryUser from "./components/user/History";
import ProfileUser from "./components/user/UserProfile";
import HomeSupervisor from "./components/supervisor/SupervisorHome";
import ComplaintsListSupervisor from "./components/supervisor/ComplaintsList";
import ProfileSupervisor from "./components/supervisor/SupervisorProfile";
import Onboarding from "./components/user/Onboarding";
import SupervisorSelection from "./components/supervisor/SupervisorSelection";

Amplify.configure(awsExports);

function App(user) {
  const navigate = useNavigate();
  const handleSignOut = async () => {
    try {
      await signOut({ globalSignOut: true });
      navigate("/");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem("opening", JSON.stringify(true));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Onboarding" element={<Onboarding />} />
        <Route path="/homeuser" element={<HomeUser />} />
        <Route path="/webcamcaptureuser" element={<WebcamCaptureUser user={user} />} />
        <Route path="/completeduser" element={<CompletedUser />} />
        <Route path="/historyuser" element={<HistoryUser />} />
        <Route path="/profileuser" element={<ProfileUser signOut={handleSignOut} />} />
        <Route path="/homesupervisor" element={<HomeSupervisor />} />
        <Route path="/supervisorselection" element={<SupervisorSelection />} />
        <Route path="/complaintslistsupervisor" element={<ComplaintsListSupervisor />} />
        <Route path="/profilesupervisor" element={<ProfileSupervisor signOut={handleSignOut} />} />
      </Routes>
    </div>
  );
}

const AppWithAuth = withAuthenticator(App);

function AppWrapper() {
  return <AppWithAuth />;
}

export default AppWrapper;
