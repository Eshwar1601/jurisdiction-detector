const app = require("./src/api/server");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n Jurisdiction Detector running on http://localhost:${PORT}`);
  console.log(` Endpoints:`);
  console.log(`   GET  /health`);
  console.log(`   POST /detect         { "address": "..." }`);
  console.log(`   POST /detect/batch   { "home": "...", "work": "..." }\n`);
});

module.exports = app;
