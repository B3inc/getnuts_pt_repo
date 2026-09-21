import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { api } from "../api.js";

export default function Trends() {
  const [timeline, setTimeline] = useState([]);
  const [substances, setSubstances] = useState([]);
  const [compareId, setCompareId] = useState("");
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await api.get("/insights/timeline?days=60");
    setTimeline(data.timeline);
    setSubstances(data.substances);
    setLoading(false);
  }

  async function runComparison(id) {
    setCompareId(id);
    if (!id) {
      setComparison(null);
      return;
    }
    const { data } = await api.get(`/insights/compare/${id}?windowDays=14`);
    setComparison(data);
  }

  return (
    <div className="container">
      <h1>Trends</h1>
      <p style={{ color: "#666" }}>
        Your Oura metrics and check-ins over time, so you can see for yourself
        whether anything shifted around when you started or stopped something.
      </p>

      <div className="card">
        <h2>Sleep &amp; readiness</h2>
        {loading ? (
          <p>Loading...</p>
        ) : timeline.length === 0 ? (
          <p>No wearable data yet — connect and sync Oura from the dashboard first.</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sleep_score" name="Sleep score" stroke="#1f3b52" dot={false} />
              <Line type="monotone" dataKey="readiness_score" name="Readiness" stroke="#c0362c" dot={false} />
              <Line type="monotone" dataKey="hrv_avg" name="HRV" stroke="#69a297" dot={false} />
              {substances.map((s) => (
                <ReferenceLine
                  key={s.id}
                  x={s.started_on?.slice(0, 10)}
                  stroke="#999"
                  strokeDasharray="4 4"
                  label={{ value: s.substance_name, fontSize: 10, position: "top" }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card">
        <h2>How you've felt (self-reported)</h2>
        {timeline.some((t) => t.energy != null) ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="energy" name="Energy" stroke="#c0362c" dot={false} />
              <Line type="monotone" dataKey="mood" name="Mood" stroke="#1f3b52" dot={false} />
              <Line type="monotone" dataKey="soreness" name="Soreness" stroke="#69a297" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p>No daily check-ins logged yet.</p>
        )}
      </div>

      <div className="card">
        <h2>Before / after a specific substance</h2>
        <select value={compareId} onChange={(e) => runComparison(e.target.value)}>
          <option value="">Select a substance</option>
          {substances.map((s) => (
            <option key={s.id} value={s.id}>{s.substance_name} (started {s.started_on?.slice(0, 10)})</option>
          ))}
        </select>

        {comparison && (
          <div style={{ marginTop: "1rem" }}>
            <div className="metric-grid">
              <div className="metric">
                <div className="value">{fmt(comparison.before.avg_sleep)} → {fmt(comparison.after.avg_sleep)}</div>
                <div className="label">Sleep score</div>
              </div>
              <div className="metric">
                <div className="value">{fmt(comparison.before.avg_readiness)} → {fmt(comparison.after.avg_readiness)}</div>
                <div className="label">Readiness</div>
              </div>
              <div className="metric">
                <div className="value">{fmt(comparison.before.avg_hrv)} → {fmt(comparison.after.avg_hrv)}</div>
                <div className="label">HRV</div>
              </div>
              <div className="metric">
                <div className="value">{fmt(comparison.before.avg_activity)} → {fmt(comparison.after.avg_activity)}</div>
                <div className="label">Activity</div>
              </div>
            </div>
            <p className="disclaimer" style={{ marginTop: "1rem" }}>{comparison.caveat}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function fmt(v) {
  return v == null ? "–" : Number(v).toFixed(1);
}
