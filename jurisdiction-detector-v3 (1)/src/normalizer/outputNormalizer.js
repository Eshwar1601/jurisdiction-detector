function normalizeOutput(inputAddress, raw) {
  const {
    censusData,
    state,
    county,
    cityData,
    sdData,
    specialData,
    stateAbbr,
    detectionMs,
  } = raw;

  // Build ordered jurisdiction list
  const jurisdictions = [
    state,
    county,
    cityData.city,
    cityData.municipality,
    cityData.borough,
    cityData.township,
    cityData.suburb,
    sdData,
    ...specialData,
  ]
    .filter(Boolean)
    .map((j, index) => ({
      ...j,
      level: index + 1, // Re-number cleanly after filter
    }));

  // Separate nulls for transparency
  const activeJurisdictions = jurisdictions.filter((j) => j.name !== null);
  const nullJurisdictions   = jurisdictions
    .filter((j) => j.name === null)
    .map((j) => j.type);

  return {
    input_address: inputAddress,
    standardized_address: censusData.standardized,
    state_abbr: stateAbbr,
    coordinates: {
      lat: censusData.lat,
      lng: censusData.lng,
    },
    jurisdictions: activeJurisdictions,
    null_jurisdictions: nullJurisdictions,
    meta: {
      census_tract: censusData.fips.tract,
      census_block: censusData.fips.block,
      zip: censusData.zip,
      detection_ms: detectionMs,
      detected_at: new Date().toISOString(),
    },
  };
}

module.exports = { normalizeOutput };
