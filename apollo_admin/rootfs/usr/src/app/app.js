const { mqttClient, sendMqttMessage } = require("./mqttClient");
const { setupSignalRConnection, invokeSignalRMethod } = require("./signalRConnection");
const logger = require("./logger");
const { loadConfig } = require("./configManager");

const config = loadConfig();

mqttClient.on("connect", async () => {
  try {
    await mqttClient.subscribe([
      config.nodeToKubakRequest,
      config.nodeToKubakAuth,
      config.ping,
      config.nodeToKubakSetupApollo,
      config.kubakToNodeResponseNoAwait,
    ]);
    const msg = { success: true, result: "ready" };
    sendMqttMessage(config.apolloAdminReady, msg);
  } catch (e) {
    logger.error("MQTT connect error", e);
  }
});

mqttClient.on("message", async (topic, message, packet) => {
  // Expanded message handling...
});

async function startApp() {
  logger.info("Starting Application");
  // Additional initialization if necessary
}

startApp();
