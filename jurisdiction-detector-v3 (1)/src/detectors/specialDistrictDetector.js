const axios = require("axios");

const TIGER_URL =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Current/MapServer/identify";

// Only return these district types — skip non-tax-relevant ones
const RELEVANT_TYPES = [
  "transit",
  "transportation",
  "fire",
  "water",
  "sewer",
  "utility",
  "sanitation",
  "port",
  "airport",
  "hospital",
  "library",
  "park",
];

async function detectSpecialDistricts(lat, lng) {
  const params = {
    geometry: `{"x":${lng},"y":${lat},"spatialReference":{"wkid":4326}}`,
    geometryType: "esriGeometryPoint",
    sr: 4326,
    layers: "all",
    tolerance: 2,
    mapExtent: `${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}`,
    imageDisplay: "800,600,96",
    returnGeometry: false,
    f: "json",
  };

  try {
    const response = await axios.get(TIGER_URL, { params, timeout: 10000 });
    const results = response.data?.results || [];

    const specialDistricts = results
      .filter((r) => {
        const name = (r.layerName || r.attributes?.NAME || "").toLowerCase();
        return RELEVANT_TYPES.some((t) => name.includes(t));
      })
      .map((r, index) => ({
        level: 9 + index,
        type: "special_district",
        name: toTitleCase(r.attributes?.NAME || r.layerName),
        id: r.attributes?.GEOID || null,
        id_type: r.attributes?.GEOID ? "fips" : null,
        source: "tiger",
        meta: { district_subtype: r.layerName || null },
      }));

    return specialDistricts.length > 0 ? specialDistricts : [];
  } catch (err) {
    console.warn("TIGER special district lookup failed:", err.message);
    return [];
  }
}

function toTitleCase(str) {
  if (!str) return null;
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

module.exports = { detectSpecialDistricts };
