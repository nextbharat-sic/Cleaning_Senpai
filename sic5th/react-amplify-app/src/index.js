/* "Copyright © 2025 Suzuki Motor Corporation All Rights Reserved" */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Amplify } from 'aws-amplify';
import config from './aws-exports';
import { BrowserRouter as Router } from "react-router-dom";

Amplify.configure(config);

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render( // 追加
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);