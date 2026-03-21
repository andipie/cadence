import React from 'react';
import ReactDOM from 'react-dom/client';
import QuickCapture from './components/capture/QuickCapture';
import './styles/globals.css';

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <QuickCapture />
    </React.StrictMode>
  );
}
