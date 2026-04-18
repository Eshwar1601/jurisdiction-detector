const axios = require("axios");

const BASE_URL = "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress";

async function censusGeocode(address) {
  if (!address || typeof address !== "string") {
    throw new Error("Address must be a non-empty string");
  }

  // Reject PO Boxes early
  if (/\bP\.?O\.?\s*BOX\b/i.test(address)) {
    throw new Error("PO Box addresses cannot be geocoded. Please provide a physical address.");
  }

  const params = {
    address: address.trim(),
    benchmark: "Public_AR_Current",
    vintage: "Current_Current",
    format: "json",
  };

  const response = await axios.get(BASE_URL, { params, timeout: 10000 });
  const matches = response.data?.result?.addressMatches;

  if (!matches || matches.length === 0) {
    throw new Error(`No match found for address: "${address}". Try adding ZIP code or state.`);
  }

  const match = matches[0];
  const geo = match.geographies || {};

  const state   = geo["States"]?.[0]              || null;
  const county  = geo["Counties"]?.[0]            || null;
  const place   = geo["Incorporated Places"]?.[0] || null;
  const tract   = geo["Census Tracts"]?.[0]       || null;
  const block   = geo["Census Blocks"]?.[0]       || null;

  return {
    standardized: match.matchedAddress,
    lat: match.coordinates.y,
    lng: match.coordinates.x,
    fips: {
      state:   state?.GEOID  || null,
      county:  county?.GEOID || null,
      place:   place?.GEOID  || null,
      tract:   tract?.GEOID  || null,
      block:   block?.GEOID  || null,
    },
    names: {
      state:  state?.NAME  || null,
      county: county?.NAME || null,
      place:  place?.NAME  || null,
    },
    zip: match.addressComponents?.zip || null,
  };
}

module.exports = { censusGeocode };
