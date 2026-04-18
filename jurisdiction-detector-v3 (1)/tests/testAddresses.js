const { detectJurisdiction, detectBatch } = require("../src/orchestrator/jurisdictionOrchestrator");

const TEST_ADDRESSES = [
  {
    label: "Philadelphia PA — city + SD tax",
    address: "1600 Market St, Philadelphia, PA 19103",
  },
  {
    label: "Austin TX — no local income tax",
    address: "500 Congress Ave, Austin, TX 78701",
  },
  {
    label: "New York City NY — borough level",
    address: "350 5th Ave, New York, NY 10118",
  },
  {
    label: "Columbus OH — township state",
    address: "100 E Broad St, Columbus, OH 43215",
  },
  {
    label: "Chicago IL — city tax",
    address: "233 S Wacker Dr, Chicago, IL 60606",
  },
  {
    label: "Louisville KY — county-level tax",
    address: "500 W Jefferson St, Louisville, KY 40202",
  },
  {
    label: "Rural Montana — minimal jurisdictions",
    address: "123 Main St, Roundup, MT 59072",
  },
  {
    label: "Miami FL — no local income tax",
    address: "100 SE 2nd St, Miami, FL 33131",
  },
  {
    label: "Batch test — home Philadelphia, work Pittsburgh",
    batch: true,
    home: "1234 Walnut St, Philadelphia, PA 19107",
    work: "600 Grant St, Pittsburgh, PA 15219",
  },
  {
    label: "Error case — PO Box (should fail gracefully)",
    address: "PO Box 1234, Austin, TX 78701",
    expectError: true,
  },
];

async function runTests() {
  console.log("=".repeat(60));
  console.log(" JURISDICTION DETECTOR — TEST SUITE");
  console.log("=".repeat(60));

  let passed = 0;
  let failed = 0;

  for (const test of TEST_ADDRESSES) {
    console.log(`\n TEST: ${test.label}`);
    console.log("-".repeat(50));

    try {
      if (test.batch) {
        const result = await detectBatch(test.home, test.work);
        console.log("HOME jurisdictions:");
        printJurisdictions(result.home);
        console.log("\nWORK jurisdictions:");
        printJurisdictions(result.work);
      } else {
        const result = await detectJurisdiction(test.address);
        printJurisdictions(result);
      }

      if (test.expectError) {
        console.log(" FAIL — expected an error but got result");
        failed++;
      } else {
        console.log(" PASS");
        passed++;
      }
    } catch (err) {
      if (test.expectError) {
        console.log(` PASS (expected error: ${err.message})`);
        passed++;
      } else {
        console.log(` FAIL — ${err.message}`);
        failed++;
      }
    }

    // Respect Nominatim rate limit between tests
    await sleep(1200);
  }

  console.log("\n" + "=".repeat(60));
  console.log(` RESULTS: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(60));
}

function printJurisdictions(result) {
  console.log(`  Address : ${result.standardized_address}`);
  console.log(`  State   : ${result.state_abbr}`);
  console.log(`  Coords  : ${result.coordinates.lat}, ${result.coordinates.lng}`);
  console.log(`  Detected in: ${result.meta.detection_ms}ms`);
  console.log(`  Jurisdictions:`);
  result.jurisdictions.forEach((j) => {
    console.log(`    [${j.level}] ${j.type.padEnd(16)} → ${j.name} (${j.id || "no-id"}) [${j.source}]`);
  });
  if (result.null_jurisdictions.length > 0) {
    console.log(`  Not found   : ${result.null_jurisdictions.join(", ")}`);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

runTests().catch(console.error);
