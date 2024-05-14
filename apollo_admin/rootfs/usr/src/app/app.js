const { mqttClient, sendMqttMessage } = require("./mqttClient");
const { signalRConnection, invokeSignalR } = require("./signalRConnection");
const logger = require("./logger");
const { loadConfig } = require("./configManager");

const config = loadConfig();
let signalr;

mqttClient.on("connect", async () => {
  try {
    await mqttClient.subscribe([
      config.nodeToKubakRequest,
      config.nodeToKubakAuth,
      config.ping,
      config.nodeToKubakSetupApollo,
      config.kubakToNodeResponseNoAwait,
    ]);
    if (signalr) {
      if (signalr.state === "Connected") {
      } else {
        const msg = { success: true, result: "ready" };
        sendMqttMessage(config.apolloAdminReady, msg);
      }
    } else {
      const msg = { success: true, result: "ready" };
      sendMqttMessage(config.apolloAdminReady, msg);
    }
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
          if (!signalr) {
            logger.warn("Innitiating Signalr");
            await setupSignalRConnection(msg, responseTopic, correlationData);
          } else {
            if (signalr.state !== "Connected") {
              await setupSignalRConnection(msg, responseTopic, correlationData);
            }
          }
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
          let payload =signalr?signalr.state:"false"
          sendMqttMessage(responseTopic,payload);
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

async function setupSignalRConnection(token, responseTopic, correlationData) {
  try {
    signalr = await signalRConnection(token);
    if (signalr.state === "Connected") {
      const msg = { success: true, result: "Connected to SignalR" };
      sendMqttMessage(responseTopic, msg, correlationData);
    } else {
      logger.warn(
        "Attempting to reconnect with a new token due to token expiration..."
      );
      const msg = { success: true, result: "ready" };
      sendMqttMessage(config.apolloAdminReady, msg);
    }
  } catch (error) {
    logger.error("Error calling signalRConnection", error);
    throw error;
  }

  signalr.onclose(async (error) => {
    logger.error(`SignalR connection lost: ${error}`);

    // Check if the error is related to authentication (token expiration)
    if (error && isTokenExpiredError(error)) {
      logger.warn(
        "Attempting to reconnect with a new token due to token expiration..."
      );
      const msg = { success: true, result: "ready" };
      sendMqttMessage(config.apolloAdminReady, msg);
    } else {
      logger.warn(
        "SignalR connection closed due to an error. Attempting to reconnect..."
      );
      const msg = { success: true, result: "ready" };
      sendMqttMessage(config.apolloAdminReady, msg);
    }
  });

  signalr.on("Request", async (data) => {
    logger.info(`Received data from server on 'Request': ${data}`);
    if (data.hasResult) {
      try {
        const response = await sendMqttMessage(
          config.kubakToNodeRequest,
          data,
          "80",
          config.kubakToNodeResponse
        );

        logger.info(`Sending Response back to SignalR: ${response}`);
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
    if (signalr && signalr.state === "Connected") {
      const parsedMsg = JSON.parse(msg);
      const methodName = parsedMsg.command;
      const methodArgs = parsedMsg.data;

      const response = await invokeSignalR(methodName, methodArgs);
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
      error: { name: error.name, message: error.message },
    };
    sendMqttMessage(responseTopic, errorMsg, correlationData);
  }
}

function isTokenExpiredError(error) {
  // Implement logic to determine if the error indicates a token expiration
  // This might include checking error messages or types depending on how your server communicates token expiration
  return (
    error && (error.message.includes("401") || error.message.includes("token"))
  );
}

setInterval(() => {
  if (signalr) {
    if (signalr.state === "Connected") {
      // Perform your action here when SignalR is connected
      logger.info("SignalR is connected");
    } else {
      // Optionally, perform your action here when SignalR is not connected
      logger.warn("SIgnalr not connected, innitiating");
      const msg = { success: true, result: "ready" };
      sendMqttMessage(config.apolloAdminReady, msg);
    }
  } else {
    if (mqttClient.connected) {
      const msg = { success: true, result: "ready" };
      sendMqttMessage(config.apolloAdminReady, msg);
    }
  }
}, 10000);
