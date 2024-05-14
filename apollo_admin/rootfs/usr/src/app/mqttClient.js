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

async function sendMqttMessage(
  topic,
  payload,
  correlationData = "1",
  responseTopic,
  responseTopicNoAwait
) {
  
  return new Promise((resolve, reject) => {
    try {
      const options = {
        properties: {
          correlationData: Buffer.from(correlationData),
        },
      };

      if (responseTopic) {
        options.properties.responseTopic = responseTopic;
      }
      if (responseTopicNoAwait) {
        payload.responseTopicNoAwait = responseTopicNoAwait;
      }

      if (typeof payload !== "string") {
        payload = JSON.stringify(payload);
      }

      mqttClient.publish(topic, payload, options, (err) => {
        if (err) {
          logger.error("Publish error", err);
          reject(err);
        } else {
          logger.info(`Message sent, 
            ${topic},
            ${payload},
            ${JSON.stringify(options)},
          
          `);
          if (responseTopic) {
            responseListener(responseTopic, correlationData, resolve, reject);
          } else {
            resolve();
          }
        }
      });
    } catch (e) {
      logger.error("Error sending MQTT message", e);
      reject(e);
    }
  });
}

function responseListener(responseTopic, correlationData, resolve, reject) {
  try {
    mqttClient.subscribe(responseTopic, (err) => {
      if (err) {
        logger.error("Subscribe error", err);
        reject(err);
      } else {
        mqttClient.once("message", (responseTopic, message, packet) => {
          const receivedCorrelationData = packet.properties
            ? packet.properties.correlationData.toString()
            : null;
          if (receivedCorrelationData === correlationData) {
            mqttClient.unsubscribe(responseTopic);
            resolve(message.toString());
          }
        });
      }
    });
  } catch (e) {
    logger.error("Error in responseListener", e);
    reject(e);
  }
}

module.exports = {
  mqttClient,
  sendMqttMessage,
};
