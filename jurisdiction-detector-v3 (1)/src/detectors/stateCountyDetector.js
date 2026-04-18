function detectStateCounty(censusData) {
  const { fips, names } = censusData;

  const state = fips.state
    ? {
        level: 1,
        type: "state",
        name: names.state ? toTitleCase(names.state) : null,
        id: fips.state,
        id_type: "fips",
        source: "census",
      }
    : nullJurisdiction(1, "state");

  const county = fips.county
    ? {
        level: 2,
        type: "county",
        name: names.county ? toTitleCase(names.county) : null,
        id: fips.county,
        id_type: "fips",
        source: "census",
      }
    : nullJurisdiction(2, "county");

  return { state, county };
}

function toTitleCase(str) {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function nullJurisdiction(level, type) {
  return { level, type, name: null, id: null, id_type: null, source: null };
}

module.exports = { detectStateCounty };
