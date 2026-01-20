import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// StrictMode enabled in development for better debugging.
// Camera hook uses ref pattern (useCameraCapture) which is StrictMode-safe.
// If camera flickering occurs, check useCameraCapture implementation.
const isDevelopment = import.meta.env.DEV;

root.render(
  isDevelopment ? (
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  ) : (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  )
);
