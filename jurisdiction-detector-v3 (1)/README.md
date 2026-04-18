# Jurisdiction Detector

Detects all US tax jurisdictions for any address — completely free, no API keys needed.

## Sources Used
| Data | Source | Cost |
|------|--------|------|
| Address standardization + FIPS | Census Geocoder | Free |
| City / Town / Township / Borough | Nominatim (OSM) | Free |
| School District | NCES ArcGIS API | Free |
| Special Districts | Census TIGER | Free |

## Setup
```bash
npm install
node index.js       # Start API server on port 3000
npm test            # Run test suite
```

## API Endpoints

### Single address
```
POST /detect
{ "address": "1600 Market St, Philadelphia, PA 19103" }
```

### Home + Work (tax engine use case)
```
POST /detect/batch
{ "home": "123 Main St, Philadelphia PA", "work": "456 Oak Ave, Pittsburgh PA" }
```

## Output Schema
```json
{
  "input_address": "...",
  "standardized_address": "...",
  "state_abbr": "PA",
  "coordinates": { "lat": 0.0, "lng": 0.0 },
  "jurisdictions": [
    { "level": 1, "type": "state",           "name": "Pennsylvania",              "id": "42",      "id_type": "fips", "source": "census"    },
    { "level": 2, "type": "county",          "name": "Philadelphia County",       "id": "42101",   "id_type": "fips", "source": "census"    },
    { "level": 3, "type": "city",            "name": "Philadelphia",              "id": null,      "id_type": null,   "source": "nominatim" },
    { "level": 4, "type": "school_district", "name": "Philadelphia City Sd",      "id": "4213320", "id_type": "nces", "source": "nces"      }
  ],
  "null_jurisdictions": ["municipality", "borough", "township"],
  "meta": {
    "census_tract": "...",
    "census_block": "...",
    "zip": "19103",
    "detection_ms": 820,
    "detected_at": "2024-01-15T10:30:00Z"
  }
}
```

## Integration
```javascript
// In your tax engine
const { detectJurisdiction } = require('./jurisdiction-detector/src/orchestrator/jurisdictionOrchestrator');
const result = await detectJurisdiction("123 Main St, Philadelphia PA");
// Filter result.jurisdictions based on your state tax config
```
