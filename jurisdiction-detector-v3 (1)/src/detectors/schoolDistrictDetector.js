const axios = require("axios");

// NCES ArcGIS REST endpoint for unified school districts
const NCES_URL =
  "https://nces.ed.gov/opengis/rest/services/K12_School_Locations/EDGE_SCHOOLDISTRICT_TL23_SY2223/MapServer/2/query";

async function detectSchoolDistrict(lat, lng) {
  const params = {
    geometry: `${lng},${lat}`,
    geometryType: "esriGeometryPoint",
    inSR: 4326,
    spatialRel: "esriSpatialRelIntersects",
    outFields: "*",
    returnGeometry: false,
    f: "json",
  };

  try {
    const response = await axios.get(NCES_URL, { params, timeout: 10000 });
    const features = response.data?.features;

    if (!features || features.length === 0) {
      return nullJurisdiction(8, "school_district");
    }

const sd = features[0].attributes;
console.log("NCES keys:", Object.keys(sd));
const sdName = sd.NAME || sd.SDNAME || sd.LEA_NAME || null;
if (!sdName) return nullJurisdiction(8, "school_district");

return {
  level: 8,
  type: "school_district",
  name: toTitleCase(sdName),
      id: sd.GEOID || null,
      id_type: "nces",
      source: "nces",
      meta: {
        sd_type: sdType,
        grade_range: sd.LOGRADE && sd.HIGRADE ? `${sd.LOGRADE}-${sd.HIGRADE}` : null,
      },
    };
  } catch (err) {
    // NCES can be flaky — return null gracefully, don't crash
    console.warn("NCES school district lookup failed:", err.message);
    return nullJurisdiction(8, "school_district");
  }
}

function resolveSDType(sdtyp, lsad) {
  if (sdtyp === "U" || lsad === "00") return "unified";
  if (sdtyp === "E") return "elementary";
  if (sdtyp === "S") return "secondary";
  return "unified";
}

function toTitleCase(str) {
  if (!str) return null;
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function nullJurisdiction(level, type) {
  return { level, type, name: null, id: null, id_type: null, source: null };
}

module.exports = { detectSchoolDistrict };
