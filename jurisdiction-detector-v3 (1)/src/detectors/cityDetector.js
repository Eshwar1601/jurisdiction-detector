const axios = require("axios");

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

// States where township is a meaningful tax jurisdiction
const TOWNSHIP_TAX_STATES = ["OH", "IN", "PA", "MI", "NJ", "IL", "MN", "WI", "ND", "SD", "NE", "KS"];

let lastCallTime = 0;

async function rateLimit() {
  const now = Date.now();
  const elapsed = now - lastCallTime;
  if (elapsed < 1100) {
    await new Promise((r) => setTimeout(r, 1100 - elapsed));
  }
  lastCallTime = Date.now();
}

async function detectCityMunicipality(lat, lng, stateAbbr) {
  await rateLimit();

  const params = {
    lat,
    lon: lng,
    format: "json",
    addressdetails: 1,
    zoom: 14,
  };

  const response = await axios.get(NOMINATIM_URL, {
    params,
    timeout: 8000,
    headers: { "User-Agent": "jurisdiction-detector/1.0 (tax-engine-project)" },
  });

  const addr = response.data?.address || {};

  // OSM uses different field names depending on settlement type
  const city         = addr.city         || null;
  const town         = addr.town         || null;
  const village      = addr.village      || null;
  const municipality = addr.municipality || null;
  const suburb       = addr.suburb       || null;
  const neighbourhood= addr.neighbourhood|| null;
  const township     = addr.township     || null;
  const borough      = addr.borough      || null;
  const county       = addr.county       || null;

  // Resolve best city-level name (priority order)
  const cityName = city || town || village || municipality || null;

  // Township only relevant in certain states
  const showTownship = stateAbbr && TOWNSHIP_TAX_STATES.includes(stateAbbr.toUpperCase());

  return {
    city: cityName ? {
      level: 3,
      type: city ? "city" : town ? "town" : village ? "village" : "municipality",
      name: toTitleCase(cityName),
      id: null,
      id_type: null,
      source: "nominatim",
    } : nullJurisdiction(3, "city"),

    municipality: municipality && municipality !== cityName ? {
      level: 4,
      type: "municipality",
      name: toTitleCase(municipality),
      id: null,
      id_type: null,
      source: "nominatim",
    } : nullJurisdiction(4, "municipality"),

    borough: borough ? {
      level: 5,
      type: "borough",
      name: toTitleCase(borough),
      id: null,
      id_type: null,
      source: "nominatim",
    } : nullJurisdiction(5, "borough"),

    township: showTownship && township ? {
      level: 6,
      type: "township",
      name: toTitleCase(township),
      id: null,
      id_type: null,
      source: "nominatim",
    } : nullJurisdiction(6, "township"),

    suburb: suburb ? {
      level: 7,
      type: "suburb",
      name: toTitleCase(suburb),
      id: null,
      id_type: null,
      source: "nominatim",
    } : nullJurisdiction(7, "suburb"),
  };
}

function toTitleCase(str) {
  if (!str) return null;
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function nullJurisdiction(level, type) {
  return { level, type, name: null, id: null, id_type: null, source: null };
}

module.exports = { detectCityMunicipality };
