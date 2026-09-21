import { useState } from "react";
import { api } from "../api.js";

export default function DailyCheckin() {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ date: today, energy: 5, mood: 5, soreness: 5, notes: "" });
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    await api.post("/tracking/checkin", form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="card">
      <h2>Today's check-in</h2>
      <p style={{ color: "#666", fontSize: "0.9rem" }}>
        Oura doesn't know how you actually feel — this fills that gap.
      </p>
      <form onSubmit={handleSubmit}>
        {["energy", "mood", "soreness"].map((field) => (
          <div key={field}>
            <label style={{ textTransform: "capitalize" }}>{field}: {form[field]}/10</label>
            <input
              type="range"
              min="1"
              max="10"
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: Number(e.target.value) })}
            />
          </div>
        ))}
        <label>Notes</label>
        <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <button type="submit">{saved ? "Saved!" : "Save check-in"}</button>
      </form>
    </div>
  );
}
