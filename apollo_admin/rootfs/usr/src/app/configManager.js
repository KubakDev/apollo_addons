const fs = require('fs');
const yaml = require('js-yaml');
const logger = require('./logger');

function loadConfig() {
  try {
    const fileContents = fs.readFileSync("/homeassistant/secrets.yaml", "utf8");
    const data = yaml.load(fileContents);
    return data.apollo_admin;
  } catch (e) {
    logger.error("Error reading or parsing the YAML file", e);
    process.exit(4);
  }
}

module.exports = {
  loadConfig,
};
