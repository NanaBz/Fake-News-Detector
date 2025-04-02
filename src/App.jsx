import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch("https://your-backend.onrender.com/history");
        if (!response.ok) {
          throw new Error("Failed to fetch history");
        }
        const data = await response.json();
        setHistory(data.history || []); // Ensure history is an array
      } catch (error) {
        console.error("Error fetching history:", error);
      }
    };
    fetchHistory();
  }, []);

  const handleCheckNews = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      setResult(data.prediction);
      setConfidence(data.confidence);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async () => {
    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, prediction: result }),
      });
      if (response.ok) {
        alert("Report submitted successfully!");
      } else {
        alert("Failed to submit report.");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle("light-mode");
  };

  return (
    <>
      {/* Top-right button for theme toggle */}
      <button className="theme-toggle" onClick={toggleTheme}>
        {darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      </button>

      <div className={`container ${darkMode ? "" : "light-mode"}`}>
        <h1>Fake News Detector</h1>
        <div className="text-area-container">
          <textarea
            placeholder="Enter news text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          ></textarea>
          <button className="clear-text-button" onClick={() => setText("")}>
            Clear
          </button>
        </div>
        <div className="character-counter">{text.length} characters</div>
        <button onClick={handleCheckNews} disabled={loading}>
          {loading ? "Checking..." : "Check News"}
        </button>
        {loading && <div className="spinner"></div>}
        {result && (
          <div className="result">
            <p>Prediction: {result}</p>
            {confidence && <p>Confidence: {confidence}%</p>}
          </div>
        )}
        <button onClick={handleReport}>Report</button>
        <div className="links">
          <a href="https://www.snopes.com/" target="_blank" rel="noopener noreferrer">
            Visit Snopes
          </a>
          <a href="https://www.politifact.com/" target="_blank" rel="noopener noreferrer">
            Visit PolitiFact
          </a>
        </div>
        <button
          className="toggle-history-button"
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? "Hide History" : "Show History"}
        </button>
        {showHistory && (
          <div className="history">
            <h2>History</h2>
            {history.length > 0 ? (
              <ul>
                {history.map((item, index) => (
                  <li key={index}>
                    <p><strong>Text:</strong> {item.text}</p>
                    <p><strong>Prediction:</strong> {item.prediction}</p>
                    <p><strong>Confidence:</strong> {item.confidence}%</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No history available.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default App;
