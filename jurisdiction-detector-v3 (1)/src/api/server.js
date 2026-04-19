const express = require("express");
const path    = require("path");
// Allow all origins (CORS fix)
function setCORS(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.sendStatus(200); return; }
  next();
}
const { detectJurisdiction, detectBatch } = require("../orchestrator/jurisdictionOrchestrator");
const { getStateConfig, getLocalTaxStates, getNoTaxStates } = require("../taxFilter/taxFilter");

const app = express();
app.use(express.json());
app.use(setCORS);

// Serve the frontend
app.use(express.static(path.join(__dirname, "../../public")));

// Health
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "jurisdiction-detector", time: new Date().toISOString() });
});

// Single address
app.post("/detect", async (req, res) => {
  const { address } = req.body;
  if (!address || address.trim().length < 5)
    return res.status(400).json({ error: "Valid address string required" });
  const filter = req.query.raw !== "true";
  try {
    const result = await detectJurisdiction(address.trim(), { filter });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(422).json({ success: false, error: err.message });
  }
});

// Batch home + work
app.post("/detect/batch", async (req, res) => {
  const { home, work } = req.body;
  if (!home || !work)
    return res.status(400).json({ error: "Both 'home' and 'work' addresses required" });
  const filter = req.query.raw !== "true";
  try {
    const result = await detectBatch(home.trim(), work.trim(), { filter });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(422).json({ success: false, error: err.message });
  }
});

// State config endpoints
app.get("/config/local-tax-states", (req, res) => {
  res.json({ success: true, data: getLocalTaxStates() });
});
app.get("/config/no-tax-states", (req, res) => {
  res.json({ success: true, data: getNoTaxStates() });
});
app.get("/config/:state", (req, res) => {
  const config = getStateConfig(req.params.state);
  if (!config)
    return res.status(404).json({ error: `No config for state: ${req.params.state}` });
  res.json({ success: true, data: config });
});

module.exports = app;
