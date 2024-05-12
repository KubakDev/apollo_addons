const mqtt = require("mqtt");
const logger = require("./logger");
const { loadConfig } = require("./configManager");

const config = loadConfig();

const mqttClient = mqtt.connect(config.mqttUrl, {
  username: config.username,
  password: config.password,
  protocolVersion: 5,
  properties: {
    requestResponseInformation: true,
  },
});

mqttClient.on("connect", async () => {
  logger.info("MQTT Client Connected");
  // Other logic...
});

mqttClient.on("message", (topic, message, packet) => {
  // Handle incoming messages...
});

mqttClient.on("error", (err) => {
  logger.error("MQTT Error", err);
});

function sendMqttMessage(topic, payload, options = {}) {
  return new Promise((resolve, reject) => {
    if (typeof payload !== "string") {
      payload = JSON.stringify(payload);
    }
    mqttClient.publish(topic, payload, options, (err) => {
      if (err) {
        logger.error("Publish error", err);
        reject(err);
      } else {
        logger.info(`Message sent to ${topic}`);
        resolve();
      }
    });
  });
}

module.exports = {
  mqttClient,
  sendMqttMessage,
};
