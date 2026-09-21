import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";

// This question set is a starting point only. Finalize actual wording,
// field names, and which answers matter with your licensed
// nutritionist/physician -- they determine what's clinically relevant.
const QUESTIONS = [
  {
    key: "primaryGoal",
    label: "What's your main goal right now?",
    type: "select",
    options: ["More energy", "Better recovery", "Better sleep", "General wellness", "Other"],
  },
  {
    key: "recentMedicationChange",
    label: "Have you recently started, stopped, or changed any prescription medication?",
    type: "select",
    options: ["Yes", "No"],
  },
  {
    key: "activityLevel",
    label: "How would you describe your activity level lately?",
    type: "select",
    options: ["Sedentary", "Light activity", "Regular exercise (1-3x/week)", "Frequent exercise (4+/week)"],
  },
  {
    key: "sleepHours",
    label: "On average, how many hours do you sleep per night?",
    type: "number",
  },
  {
    key: "diet",
    label: "How would you describe your diet?",
    type: "select",
    options: ["Balanced", "High protein", "Low protein / plant-based", "Irregular / skip meals", "Not sure"],
  },
];

export default function Questionnaire() {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function updateAnswer(key, value) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.post("/questionnaire", { responses: answers });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong submitting your answers");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container">
      <h1>Tell us how you're doing</h1>

      <div className="disclaimer">
        This questionnaire is for informational purposes and does not replace
        medical advice. Any recommendations shown are authored and reviewed
        by a licensed provider — always check with your own doctor or
        pharmacist before starting, stopping, or combining anything,
        especially around medication changes.
      </div>

      {!result && (
        <form className="card" onSubmit={handleSubmit}>
          {QUESTIONS.map((q) => (
            <div key={q.key}>
              <label>{q.label}</label>
              {q.type === "select" ? (
                <select
                  value={answers[q.key] || ""}
                  onChange={(e) => updateAnswer(q.key, e.target.value)}
                  required
                >
                  <option value="" disabled>Select one</option>
                  {q.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={q.type}
                  value={answers[q.key] || ""}
                  onChange={(e) => updateAnswer(q.key, e.target.value)}
                  required
                />
              )}
            </div>
          ))}
          {error && <p style={{ color: "var(--accent)" }}>{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      )}

      {result && (
        <div className="card">
          <h2>Your results</h2>
          {result.recommendations.map((rec, i) =>
            rec.placeholder ? (
              <p key={i}><em>{rec.message}</em></p>
            ) : (
              <div key={i} style={{ marginBottom: "1rem" }}>
                <h3>{rec.ruleName}</h3>
                <p>{rec.content}</p>
                <p style={{ fontSize: "0.8rem", color: "#666" }}>
                  Reviewed by: {rec.reviewedBy || rec.authoredBy}
                </p>
              </div>
            )
          )}
          <button onClick={() => navigate("/dashboard")}>Go to dashboard</button>
        </div>
      )}
    </div>
  );
}
