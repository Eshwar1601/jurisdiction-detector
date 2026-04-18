/**
 * INTEGRATION EXAMPLE
 * Shows how your tax engine consumes jurisdiction-detector
 * This file lives in your TAX ENGINE project, not this one
 */

const { detectBatch } = require("./src/orchestrator/jurisdictionOrchestrator");

// ─────────────────────────────────────────────
// EXAMPLE 1: Pennsylvania — home Philadelphia, work Pittsburgh
// Both cities have EIT (Earned Income Tax)
// ─────────────────────────────────────────────
async function example_Pennsylvania() {
  console.log("\n── EXAMPLE 1: Pennsylvania ──────────────────────────");

  const result = await detectBatch(
    "1234 Walnut St, Philadelphia, PA 19107",
    "600 Grant St, Pittsburgh, PA 15219"
  );

  // What your tax engine reads:
  console.log("\nHOME tax chain:", result.home.taxChain);
  // → ["state", "city", "school_district"]

  console.log("WORK tax chain:", result.work.taxChain);
  // → ["state", "city", "school_district"]

  console.log("\nHOME tax jurisdictions:");
  result.home.taxJurisdictions.forEach(j =>
    console.log(`  ${j.type}: ${j.name} (${j.id})`)
  );

  console.log("\nWORK tax jurisdictions:");
  result.work.taxJurisdictions.forEach(j =>
    console.log(`  ${j.type}: ${j.name} (${j.id})`)
  );

  console.log("\nNotes:", result.home.taxConfig.notes);
}

// ─────────────────────────────────────────────
// EXAMPLE 2: Texas — no tax at all
// ─────────────────────────────────────────────
async function example_Texas() {
  console.log("\n── EXAMPLE 2: Texas ─────────────────────────────────");

  const result = await detectBatch(
    "500 Congress Ave, Austin, TX 78701",
    "1 AT&T Plaza, Dallas, TX 75202"
  );

  console.log("\nHOME tax chain:", result.home.taxChain);
  // → []  (empty — no income tax in Texas)

  console.log("WORK tax chain:", result.work.taxChain);
  // → []

  console.log("Notes:", result.home.taxConfig?.notes);
}

// ─────────────────────────────────────────────
// EXAMPLE 3: Ohio — city + school district tax
// ─────────────────────────────────────────────
async function example_Ohio() {
  console.log("\n── EXAMPLE 3: Ohio ──────────────────────────────────");

  const result = await detectBatch(
    "100 E Broad St, Columbus, OH 43215",
    "200 Public Square, Cleveland, OH 44114"
  );

  console.log("\nHOME tax chain:", result.home.taxChain);
  // → ["state", "city", "township", "school_district"]

  console.log("WORK tax chain:", result.work.taxChain);
  // → ["state", "city", "township", "school_district"]
}

// ─────────────────────────────────────────────
// EXAMPLE 4: Maryland — all counties have local tax
// ─────────────────────────────────────────────
async function example_Maryland() {
  console.log("\n── EXAMPLE 4: Maryland ──────────────────────────────");

  const result = await detectBatch(
    "100 Light St, Baltimore, MD 21202",
    "7500 Greenway Center Dr, Greenbelt, MD 20770"
  );

  console.log("\nHOME tax chain:", result.home.taxChain);
  // → ["state", "county"]  (MD taxes by county)

  console.log("WORK tax chain:", result.work.taxChain);
  // → ["state", "county"]

  result.home.taxJurisdictions.forEach(j =>
    console.log(`  HOME ${j.type}: ${j.name}`)
  );
  result.work.taxJurisdictions.forEach(j =>
    console.log(`  WORK ${j.type}: ${j.name}`)
  );
}

// Run all examples
(async () => {
  try {
    await example_Pennsylvania();
    await example_Texas();
    await example_Ohio();
    await example_Maryland();
  } catch (err) {
    console.error("Error:", err.message);
  }
})();
