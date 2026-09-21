import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import DailyCheckin from "./DailyCheckin.jsx";

export default function Dashboard() {
  const [wearableData, setWearableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connectError, setConnectError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data } = await api.get("/oura/data?days=14");
      setWearableData(data);
    } catch (err) {
      // Likely means Oura isn't connected yet -- not a fatal error
      setWearableData([]);
    } finally {
      setLoading(false);
    }
  }

  async function connectOura() {
    setConnectError("");
    try {
      const { data } = await api.get("/oura/connect");
      window.location.href = data.authUrl;
    } catch (err) {
      setConnectError("Could not start Oura connection. Check backend Oura credentials.");
    }
  }

  async function syncOura() {
    setSyncing(true);
    try {
      await api.post("/oura/sync?days=14");
      await loadData();
    } catch (err) {
      setConnectError(err.response?.data?.error || "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  const latest = wearableData[0];
  const apiBase = api.defaults.baseURL;
  const token = localStorage.getItem("token");

  function exportUrl(name) {
    // Simple approach for a personal single-user tool: pass the token as a
    // query param since <a href> downloads can't send an Authorization header.
    return `${apiBase}/export/${name}?token=${encodeURIComponent(token)}`;
  }

  return (
    <div className="container">
      <h1>Dashboard</h1>

      <div className="card">
        <h2>Oura Ring</h2>
        {connectError && <p style={{ color: "var(--accent)" }}>{connectError}</p>}
        <p>Connect your Oura account to pull in sleep, readiness, and activity data.</p>
        <button onClick={connectOura}>Connect Oura</button>{" "}
        <button className="accent" onClick={syncOura} disabled={syncing}>
          {syncing ? "Syncing..." : "Sync latest data"}
        </button>
      </div>

      <div className="card">
        <h2>Latest metrics</h2>
        {loading ? (
          <p>Loading...</p>
        ) : latest ? (
          <>
            <p style={{ color: "#666" }}>{latest.date}</p>
            <div className="metric-grid">
              <div className="metric">
                <div className="value">{latest.sleep_score ?? "–"}</div>
                <div className="label">Sleep score</div>
              </div>
              <div className="metric">
                <div className="value">{latest.readiness_score ?? "–"}</div>
                <div className="label">Readiness</div>
              </div>
              <div className="metric">
                <div className="value">{latest.activity_score ?? "–"}</div>
                <div className="label">Activity</div>
              </div>
              <div className="metric">
                <div className="value">{latest.steps ?? "–"}</div>
                <div className="label">Steps</div>
              </div>
            </div>
          </>
        ) : (
          <p>No wearable data yet — connect and sync your Oura ring above.</p>
        )}
      </div>

      <DailyCheckin />

      <div className="card">
        <h2>What you're taking</h2>
        <p>Log peptides, amino acids, protein — whatever you're currently on.</p>
        <button onClick={() => navigate("/substances")}>Manage substance log</button>
      </div>

      <div className="card">
        <h2>Trends</h2>
        <p>See your Oura metrics and check-ins charted against what you've been taking.</p>
        <button onClick={() => navigate("/trends")}>View trends</button>
      </div>

      <div className="card">
        <h2>Export your data</h2>
        <p>Download your raw data as CSV any time — it's yours, keep a copy outside the app.</p>
        <a className="btn" href={exportUrl("substances.csv")} style={{ marginRight: "0.5rem" }}>Substances</a>
        <a className="btn" href={exportUrl("checkins.csv")} style={{ marginRight: "0.5rem" }}>Check-ins</a>
        <a className="btn" href={exportUrl("wearable.csv")}>Wearable data</a>
      </div>
    </div>
  );
}
