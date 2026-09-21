import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { api } from "./api.js";
import Dashboard from "./components/Dashboard.jsx";
import SubstanceLog from "./components/SubstanceLog.jsx";
import Trends from "./components/Trends.jsx";

export default function App() {
  const [ready, setReady] = useState(Boolean(localStorage.getItem("token")));
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready) return;
    api
      .get("/auth/auto")
      .then(({ data }) => {
        localStorage.setItem("token", data.token);
        setReady(true);
      })
      .catch(() => setError("Could not connect to the server. Is the backend running?"));
  }, [ready]);

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <h2>Connection problem</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/substances" element={<SubstanceLog />} />
      <Route path="/trends" element={<Trends />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
