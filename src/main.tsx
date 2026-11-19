import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "./PicharaStudio/components/ErrorBoundary";
import "./index.css";

// Lazy-loaded: the portfolio never downloads diagram editor code until the
// user navigates to /diagram.
const DiagramStudio = lazy(
  () => import("./PicharaStudio/components/DiagramStudio")
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route
          path="/diagram"
          element={
            <ErrorBoundary>
              <Suspense
                fallback={
                  <div className="studio-loading">
                    Loading Pichara Studio…
                  </div>
                }
              >
                <DiagramStudio />
              </Suspense>
            </ErrorBoundary>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
