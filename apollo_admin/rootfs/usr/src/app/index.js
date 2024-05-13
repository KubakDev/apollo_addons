const mqtt = require("mqtt");
const fs = require("fs");
const yaml = require("js-yaml");
const {
  HubConnectionBuilder,
  LogLevel,
  JsonHubProtocol,
} = require("@microsoft/signalr");
const winston = require("winston");

const { createLogger, format, transports } = winston;
const { combine, printf, colorize } = format;

// Set colors for different levels
const myCustomLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  },
  colors: {
    error: "red",
    warn: "yellow",
    info: "green",
    debug: "blue",
  },
};

winston.addColors(myCustomLevels.colors);

// Custom printf format that includes human-readable AM/PM timestamps
const myFormat = printf(({ level, message, timestamp }) => {
  // Create a timestamp in the "HH:mm:ss A" format
  const time = new Date(timestamp).toLocaleTimeString("en-US", {
    hour12: true,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });

  return `${time} ${level}: ${message}`;
});

// Create a logger
const logger = createLogger({
  levels: myCustomLevels.levels,
  format: combine(colorize(), format.timestamp(), myFormat),
  transports: [new transports.Console()],
});

const config = loadConfig();

// Function to load YAML configuration
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

// Create an MQTT client
const mqttClient = mqtt.connect(config.mqttUrl, {
  username: config.username,
  password: config.password,
  protocolVersion: 5,
  properties: {
    requestResponseInformation: true,
  },
});

let signalRConnection;

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
  logger.info(`Received message from ${topic}: ${message.toString()}`);
  try {
    const { responseTopic = null, correlationData = null } =
      packet.properties || {};
    const msg = message.toString();

    switch (topic) {
      case config.nodeToKubakAuth:
        if (responseTopic && correlationData) {
          await setupSignalRConnection(msg, responseTopic, correlationData);
        } else {
          logger.warn(
            `Missing responseTopic or correlationData; cannot continue.
            ${topic}`
          );
        }

        break;
      case config.nodeToKubakSetupApollo:
        if (responseTopic && correlationData) {
          invokeSignalRMethod(msg, responseTopic, correlationData);
        } else {
          logger.warn(
            `Missing responseTopic or correlationData; cannot continue.
              ${topic}`
          );
        }
        break;

      case config.nodeToKubakRequest:
        if (responseTopic && correlationData) {
          await invokeSignalRMethod(msg, responseTopic, correlationData);
        } else {
          logger.warn(
            `Missing responseTopic or correlationData; cannot continue.
            ${topic}`
          );
        }
        break;

      case config.ping:
        if (responseTopic && correlationData) {
          sendMqttMessage(responseTopic, signalRConnection.state);
        } else {
          logger.warn(
            `Missing responseTopic or correlationData; cannot continue.
            ${topic}`
          );
        }
        break;

      case config.kubakToNodeResponseNoAwait:
        // No specific action required
        break;

      default:
        logger.info(`No handler for topic: ${topic}`);
        break;
    }
  } catch (e) {
    logger.error("Error handling MQTT message", e);
  }
});

function sendMqttMessage(
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

async function setupSignalRConnection(token, responseTopic, correlationData) {
  try {
    const baseUrlWithToken = `${config.baseUrl}/apollo-hub?access-token=${token}`;
    signalRConnection = new HubConnectionBuilder()
      .withUrl(baseUrlWithToken)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    await signalRConnection.start();
    logger.info("Connected to SignalR");
    if (signalRConnection.state === "Connected") {
      const msg = { success: true, result: "Connected to SignalR" };
      sendMqttMessage(responseTopic, msg, correlationData);
    }
  } catch (err) {
    logger.error("SignalR connection error", err);
  }

  signalRConnection.onclose(async (error) => {
    logger.error(`SignalR connection lost: ${error}`);

    // Check if the error is related to authentication (token expiration)
    if (error && isTokenExpiredError(error)) {
      logger.info(
        "Attempting to reconnect with a new token due to token expiration..."
      );
      const msg = { success: true, result: "ready" };
      sendMqttMessage(config.apolloAdminReady, msg);
    } else {
      logger.warn(
        "SignalR connection closed due to an error. Attempting to reconnect..."
      );
      await setupSignalRConnection(token, responseTopic, correlationData);
    }
  });

  signalRConnection.on("Request", async (data) => {
    logger.info(`Received data from server on 'Request': ${data}`);
    if (data.hasResult) {
      try {
        const response = await sendMqttMessage(
          config.kubakToNodeRequest,
          data,
          "80",
          config.kubakToNodeResponse
        );
        logger.info(`Sending Response back to SignalR`);
        return JSON.parse(response);
      } catch (error) {
        logger.error("Error processing 'Request' from SignalR", error);
        return {
          success: false,
          error: { code: "0101", message: "mqtt error" },
        };
      }
    } else {
      try {
        sendMqttMessage(
          config.kubakToNodeRequest,
          data,
          "80",
          null,
          config.kubakToNodeResponseNoAwait
        );
      } catch (error) {
        logger.error(
          "Error sending MQTT message for 'Request' from SignalR",
          error
        );
      }
    }
  });
}

async function invokeSignalRMethod(msg, responseTopic, correlationData) {
  try {
    if (signalRConnection && signalRConnection.state === "Connected") {
      const parsedMsg = JSON.parse(msg);
      const methodName = parsedMsg.command;
      const methodArgs = parsedMsg.data;

      const response = await signalRConnection.invoke(methodName, methodArgs);
      logger.info(`Response from ${methodName}: ${response}`);

      sendMqttMessage(responseTopic, response, correlationData);
    } else {
      logger.warn("SignalR is not connected. Sending ready message.");
      const msg = { success: true, result: "ready" };
      sendMqttMessage(config.apolloAdminReady, msg);
    }
  } catch (error) {
    logger.error(`Error invoking method on SignalR`, error);
    const errorMsg = {
      success: false,
      error: { name: error.name, message: error.message, stack: error.stack },
    };
    sendMqttMessage(responseTopic, errorMsg, correlationData);
  }
}

function responseListener(responseTopic, correlationData, resolve, reject) {
  try {
    mqttClient.subscribe(responseTopic, (err) => {
      if (err) {
        logger.error("Subscribe error", err);
        reject(err);
      } else {
        mqttClient.once("message", (topic, message, packet) => {
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

mqttClient.on("reconnect", () => {
  logger.warn("Reconnecting to MQTT...");
});

mqttClient.on("error", (err) => {
  logger.error("MQTT Error", err);
});

// Function to determine if the error is due to token expiration
function isTokenExpiredError(error) {
  // Implement logic to determine if the error indicates a token expiration
  // This might include checking error messages or types depending on how your server communicates token expiration
  return (
    error && (error.message.includes("401") || error.message.includes("token"))
  );
}

process.on("SIGINT", async () => {
  if (mqttClient) {
    mqttClient.end();
  }
  if (signalRConnection) {
    await signalRConnection.stop();
  }
  logger.info("Gracefully shutting down...");
  process.exit(0);
});

// setInterval(async () => {
//   if (!signalRConnection || signalRConnection.state !== "Connected") {
//     logger.warn("SignalR connection is not active. Attempting to reconnect...");
//     const msg = { success: true, result: "ready" };
//     sendMqttMessage(config.apolloAdminReady, msg);
//   } else {
//     logger.info("SignalR connection is active and healthy.");
//   }
// }, 600000); // 10 minutes
