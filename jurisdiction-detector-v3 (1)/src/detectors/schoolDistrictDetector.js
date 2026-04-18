const axios = require("axios");

const SD_URLS = [
  "https://services1.arcgis.com/Ua5sjt3LWTPigjyD/arcgis/rest/services/School_Districts_Current/FeatureServer/0/query",
  "https://nces.ed.gov/opengis/rest/services/K12_School_Locations/EDGE_SCHOOLDISTRICT_TL23_SY2223/MapServer/2/query",
  "https://nces.ed.gov/opengis/rest/services/K12_School_Locations/EDGE_SCHOOLDISTRICT_TL23_SY2223/MapServer/1/query",
];

async function detectSchoolDistrict(lat, lng) {
  for (const url of SD_URLS) {
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
      const sdName = sd.NAME || sd.SDNAME || sd.LEA_NAME || sd.DISTNAME || sd.NAMELSAD || null;

      if (!sdName) continue;

      return {
        level: 8,
        type: "school_district",
        name: toTitleCase(sdName),
        id: sd.GEOID || sd.LEAID ? String(sd.GEOID || sd.LEAID) : null,
        id_type: "nces",
        source: "nces",
        meta: {
          sd_type: resolveSDType(sd.SDTYP, sd.LSAD),
          grade_range: sd.LOGRADE && sd.HIGRADE ? `${sd.LOGRADE}-${sd.HIGRADE}` : null,
        },
      };
    } catch (err) {
      console.warn("SD URL failed:", url, err.message);
      continue;
    }
  }

  return nullJurisdiction(8, "school_district");
}

function resolveSDType(sdtyp, lsad) {
  if (!sdtyp && !lsad) return "unified";
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
