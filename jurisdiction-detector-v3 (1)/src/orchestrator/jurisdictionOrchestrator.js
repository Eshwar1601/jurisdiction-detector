const { censusGeocode }         = require("../geocoder/censusGeocoder");
const { detectStateCounty }     = require("../detectors/stateCountyDetector");
const { detectCityMunicipality }= require("../detectors/cityDetector");
const { detectSchoolDistrict }  = require("../detectors/schoolDistrictDetector");
const { detectSpecialDistricts }= require("../detectors/specialDistrictDetector");
const { normalizeOutput }       = require("../normalizer/outputNormalizer");
const { applyTaxFilter }        = require("../taxFilter/taxFilter");

function extractStateAbbr(standardizedAddress) {
  const match = standardizedAddress?.match(/,\s*([A-Z]{2})\s+\d{5}/);
  return match ? match[1] : null;
}

async function detectJurisdiction(rawAddress, options = {}) {
  const { filter = true } = options;
  const startTime = Date.now();

  const censusData = await censusGeocode(rawAddress);
  const { lat, lng, standardized } = censusData;
  const stateAbbr = extractStateAbbr(standardized);

  const [cityData, sdData, specialData] = await Promise.all([
    detectCityMunicipality(lat, lng, stateAbbr),
    detectSchoolDistrict(lat, lng),
    detectSpecialDistricts(lat, lng),
  ]);

  const { state, county } = detectStateCounty(censusData);

  const normalized = normalizeOutput(rawAddress, {
    censusData, state, county, cityData, sdData, specialData,
    stateAbbr, detectionMs: Date.now() - startTime,
  });

  return filter ? applyTaxFilter(normalized) : normalized;
}

async function detectBatch(homeAddress, workAddress, options = {}) {
  const [home, work] = await Promise.all([
    detectJurisdiction(homeAddress, options),
    detectJurisdiction(workAddress, options),
  ]);
  return { home, work };
}

module.exports = { detectJurisdiction, detectBatch };
