const stateTaxConfig = require("../../data/stateTaxConfig.json");

/**
 * Filters the full jurisdiction list down to only tax-relevant layers
 * based on the state's known tax structure.
 *
 * @param {Object} detectorOutput - Full output from jurisdictionOrchestrator
 * @returns {Object} - Same structure with added taxChain and filtered taxJurisdictions
 */
function applyTaxFilter(detectorOutput) {
  const stateAbbr = detectorOutput.state_abbr;

  if (!stateAbbr) {
    return {
      ...detectorOutput,
      taxChain: [],
      taxJurisdictions: [],
      taxConfig: null,
      warning: "Could not determine state — no tax filter applied",
    };
  }

  const config = stateTaxConfig[stateAbbr.toUpperCase()];

  if (!config) {
    return {
      ...detectorOutput,
      taxChain: [],
      taxJurisdictions: [],
      taxConfig: null,
      warning: `No tax config found for state: ${stateAbbr}`,
    };
  }

  // No income tax at all — return empty
  if (config.applicable_levels.length === 0) {
    return {
      ...detectorOutput,
      taxChain: [],
      taxJurisdictions: [],
      taxConfig: config,
    };
  }

  // Filter jurisdictions to only applicable levels
  const taxJurisdictions = detectorOutput.jurisdictions.filter((j) =>
    config.applicable_levels.includes(j.type) && j.name !== null
  );

  // Build a simple ordered chain label for easy reading
  const taxChain = taxJurisdictions.map((j) => j.type);

  return {
    ...detectorOutput,
    taxChain,
    taxJurisdictions,
    taxConfig: {
      state_name: config.name,
      has_state_tax: config.state_income_tax,
      has_local_tax: config.local_income_tax,
      applicable_levels: config.applicable_levels,
      notes: config.notes,
    },
  };
}

/**
 * Apply tax filter to batch result (home + work)
 */
function applyTaxFilterBatch(batchOutput) {
  return {
    home: applyTaxFilter(batchOutput.home),
    work: applyTaxFilter(batchOutput.work),
  };
}

/**
 * Get the tax config for a state without a full detection run
 */
function getStateConfig(stateAbbr) {
  return stateTaxConfig[stateAbbr?.toUpperCase()] || null;
}

/**
 * List all states that have local income tax — useful for UI hints
 */
function getLocalTaxStates() {
  return Object.entries(stateTaxConfig)
    .filter(([, cfg]) => cfg.local_income_tax)
    .map(([abbr, cfg]) => ({ abbr, name: cfg.name, levels: cfg.applicable_levels }));
}

/**
 * List all states with no income tax at all
 */
function getNoTaxStates() {
  return Object.entries(stateTaxConfig)
    .filter(([, cfg]) => !cfg.state_income_tax && !cfg.local_income_tax)
    .map(([abbr, cfg]) => ({ abbr, name: cfg.name }));
}

module.exports = {
  applyTaxFilter,
  applyTaxFilterBatch,
  getStateConfig,
  getLocalTaxStates,
  getNoTaxStates,
};
