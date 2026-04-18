const axios = require("axios");

const NCES_URLS = [
  "https://nces.ed.gov/opengis/rest/services/K12_School_Locations/EDGE_SCHOOLDISTRICT_TL23_SY2223/MapServer/2/query",
  "https://nces.ed.gov/opengis/rest/services/K12_School_Locations/EDGE_SCHOOLDISTRICT_TL23_SY2223/MapServer/1/query",
  "https://nces.ed.gov/opengis/rest/services/K12_School_Locations/EDGE_SCHOOLDISTRICT_TL23_SY2223/MapServer/0/query",
];

async function detectSchoolDistrict(lat, lng) {
  for (const url of NCES_URLS) {
    try {
      const params = {
        geometry: `${lng},${lat}`,
        geometryType: "esriGeometryPoint",
        inSR: 4326,
        spatialRel: "esriSpatialRelIntersects",
        outFields: "*",
        returnGeometry: false,
        f: "json",
      };

      const response = await axios.get(url, { params, timeout: 15000 });
      const features = response.data?.features;

      if (!features || features.length === 0) continue;

      const sd = features[0].attributes;
      const sdName = sd.NAME || sd.SDNAME || sd.LEA_NAME || sd.DISTNAME || null;

      if (!sdName) continue;

      return {
        level: 8,
        type: "school_district",
        name: toTitleCase(sdName),
        id: sd.GEOID || sd.LEAID || null,
        id_type: "nces",
        source: "nces",
        meta: {
          sd_type: resolveSDType(sd.SDTYP, sd.LSAD),
          grade_range: sd.LOGRADE && sd.HIGRADE
            ? `${sd.LOGRADE}-${sd.HIGRADE}`
            : null,
        },
      };
    } catch (err) {
      console.warn(`NCES URL failed (${url}):`, err.message);
      continue;
    }
  }

  // All NCES URLs failed — try Census Tiger as fallback
  return await detectSDFromTiger(lat, lng);
}

async function detectSDFromTiger(lat, lng) {
  try {
    const url = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/School_Districts/MapServer/0/query";
    const params = {
      geometry: `${lng},${lat}`,
      geometryType: "esriGeometryPoint",
      inSR: 4326,
      spatialRel: "esriSpatialRelIntersects",
      outFields: "NAME,GEOID,SDTYP,LOGRADE,HIGRADE",
      returnGeometry: false,
      f: "json",
    };

    const response = await axios.get(url, { params, timeout: 15000 });
    const features = response.data?.features;

    if (!features || features.length === 0) return nullJurisdiction(8, "school_district");

    const sd = features[0].attributes;
    const sdName = sd.NAME || null;

    if (!sdName) return nullJurisdiction(8, "school_district");

    return {
      level: 8,
      type: "school_district",
      name: toTitleCase(sdName),
      id: sd.GEOID || null,
      id_type: "fips",
      source: "tiger",
      meta: {
        sd_type: resolveSDType(sd.SDTYP, null),
        grade_range: sd.LOGRADE && sd.HIGRADE
          ? `${sd.LOGRADE}-${sd.HIGRADE}`
          : null,
      },
    };
  } catch (err) {
    console.warn("Tiger SD fallback failed:", err.message);
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
