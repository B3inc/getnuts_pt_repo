import { useEffect, useState } from "react";
import { api } from "../api.js";

const CATEGORIES = ["peptide", "amino_acid", "protein", "other"];

export default function SubstanceLog() {
  const [substances, setSubstances] = useState([]);
  const [form, setForm] = useState({
    substanceName: "",
    category: "peptide",
    dose: "",
    startedOn: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await api.get("/tracking/substances");
    setSubstances(data);
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/tracking/substances", form);
      setForm({ ...form, substanceName: "", dose: "", notes: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add");
    }
  }

  async function markEnded(id) {
    await api.put(`/tracking/substances/${id}`, { endedOn: new Date().toISOString().slice(0, 10) });
    load();
  }

  async function remove(id) {
    await api.delete(`/tracking/substances/${id}`);
    load();
  }

  return (
    <div className="container">
      <h1>What you're taking</h1>
      <p style={{ color: "#666" }}>
        This is your own log — nothing here is validated or interpreted by the app.
        It's just a record so you can line it up against your Oura data later.
      </p>

      <form className="card" onSubmit={handleAdd}>
        <label>Substance name</label>
        <input
          value={form.substanceName}
          onChange={(e) => setForm({ ...form, substanceName: e.target.value })}
          placeholder="e.g. BPC-157, L-Glutamine, Whey protein"
          required
        />
        <label>Category</label>
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.replace("_", " ")}</option>
          ))}
        </select>
        <label>Dose (optional, free text)</label>
        <input value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} placeholder="e.g. 250mcg 2x/day" />
        <label>Started on</label>
        <input type="date" value={form.startedOn} onChange={(e) => setForm({ ...form, startedOn: e.target.value })} required />
        <label>Notes (optional)</label>
        <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        {error && <p style={{ color: "var(--accent)" }}>{error}</p>}
        <button type="submit">Add entry</button>
      </form>

      <div className="card">
        <h2>Log</h2>
        {substances.length === 0 && <p>Nothing logged yet.</p>}
        {substances.map((s) => (
          <div key={s.id} style={{ borderBottom: "1px solid #eee", padding: "0.75rem 0" }}>
            <strong>{s.substance_name}</strong> ({s.category?.replace("_", " ")})
            {s.dose && <> — {s.dose}</>}
            <div style={{ fontSize: "0.85rem", color: "#666" }}>
              Started {s.started_on?.slice(0, 10)}
              {s.ended_on ? ` · Ended ${s.ended_on.slice(0, 10)}` : " · Ongoing"}
            </div>
            {s.notes && <div style={{ fontSize: "0.9rem" }}>{s.notes}</div>}
            <div style={{ marginTop: "0.4rem" }}>
              {!s.ended_on && (
                <button onClick={() => markEnded(s.id)} style={{ marginRight: "0.5rem" }}>Mark ended</button>
              )}
              <button onClick={() => remove(s.id)} className="accent">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
