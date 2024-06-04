// Dependencies
const { mqttClient, sendMqttMessage } = require("./mqttClient");
const { signalRConnection, invokeSignalR } = require("./signalRConnection");
const logger = require("./logger");
const { loadConfig } = require("./configManager");

// Configuration
const config = loadConfig();

// Global Variables
let signalRInstance;

// Helper Functions

/**
 * Set up SignalR connection.
 * @param {string} token - The token for authentication.
 * @param {string} responseTopic - The MQTT topic to send the response.
 * @param {object} correlationData - The correlation data for tracking.
 */
async function setupSignalRConnection(token, responseTopic, correlationData) {
  try {
    signalRInstance = await signalRConnection(token);

    if (signalRInstance.state === "Connected") {
      const msg = { success: true, result: "Connected to SignalR" };
      sendMqttMessage(responseTopic, msg, correlationData);
    } else {
      handleTokenExpiration();
    }
  } catch (error) {
    logger.error("Error establishing SignalR connection", error);
    throw error;
  }

  signalRInstance.onclose(async (error) => {
    logger.error(`SignalR connection lost: ${error}`);
    handleSignalRDisconnection(error);
  });

  signalRInstance.on("Request", async (data) => {
    return await handleSignalRRequest(data);
  });
}

/**
 * Handle SignalR method invocation.
 * @param {string} msg - The message to be sent.
 * @param {string} responseTopic - The MQTT topic to send the response.
 * @param {object} correlationData - The correlation data for tracking.
 */
async function invokeSignalRMethod(msg, responseTopic, correlationData) {
  try {
    if (signalRInstance && signalRInstance.state === "Connected") {
      const parsedMsg = JSON.parse(msg);
      const { command: methodName, data: methodArgs } = parsedMsg;

      const response = await invokeSignalR(methodName, methodArgs);
      logger.info(`Response from ${methodName}: ${response}`);
      sendMqttMessage(responseTopic, response, correlationData);
    } else {
      handleDisconnectedSignalR(responseTopic);
    }
  } catch (error) {
    logger.error("Error invoking method on SignalR", error);
    sendMqttMessage(responseTopic, formatErrorMessage(error), correlationData);
  }
}

/**
 * Check if the error is a token expiration error.
 * @param {object} error - The error object.
 * @returns {boolean} - True if the error is a token expiration error, false otherwise.
 */
function isTokenExpiredError(error) {
  return (
    error && (error.message.includes("401") || error.message.includes("token"))
  );
}

/**
 * Handle token expiration.
 */
function handleTokenExpiration() {
  logger.warn(
    "Attempting to reconnect with a new token due to token expiration..."
  );
  const msg = { success: true, result: "ready" };
  sendMqttMessage(config.apolloAdminReady, msg);
}

/**
 * Handle SignalR disconnection.
 * @param {object} error - The error object.
 */
function handleSignalRDisconnection(error) {
  if (isTokenExpiredError(error)) {
    handleTokenExpiration();
  } else {
    logger.warn(
      "SignalR connection closed due to an error. Attempting to reconnect..."
    );
    const msg = { success: true, result: "ready" };
    sendMqttMessage(config.apolloAdminReady, msg);
  }
}

/**
 * Handle SignalR requests.
 * @param {object} data - The data from the SignalR request.
 */
async function handleSignalRRequest(data) {
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
      return formatErrorMessage(error.message);
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
      logger.info(`sending: result: null, success: true `);
      return { result: null, success: true };
    } catch (error) {
      logger.error(
        "Error sending MQTT message for 'Request' from SignalR",
        error
      );
      return formatErrorMessage(error.message);
    }
  }
}

/**
 * Handle disconnected SignalR instance.
 * @param {string} responseTopic - The MQTT topic to send the response.
 */
function handleDisconnectedSignalR(responseTopic) {
  logger.warn("SignalR is not connected. Sending ready message.");
  const msg = { success: true, result: "ready" };
  sendMqttMessage(responseTopic, msg);
}

/**
 * Format error messages.
 * @param {string} message - The error message.
 * @returns {object} - The formatted error message.
 */
function formatErrorMessage(message) {
  return {
    success: false,
    error: { code: "0101", message },
  };
}

// MQTT Client Events

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
  } catch (error) {
    logger.error("MQTT connect error", error);
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
          if (!signalRInstance || signalRInstance.state !== "Connected") {
            await setupSignalRConnection(msg, responseTopic, correlationData);
          }
        } else {
          logger.warn(
            `Missing responseTopic or correlationData; cannot continue. ${topic}`
          );
        }
        break;

      case config.nodeToKubakSetupApollo:
      case config.nodeToKubakRequest:
        if (responseTopic && correlationData) {
          await invokeSignalRMethod(msg, responseTopic, correlationData);
        } else {
          logger.warn(
            `Missing responseTopic or correlationData; cannot continue. ${topic}`
          );
        }
        break;

      case config.ping:
        if (responseTopic && correlationData) {
          const payload = signalRInstance ? signalRInstance.state : "false";
          sendMqttMessage(responseTopic, payload);
        } else {
          logger.warn(
            `Missing responseTopic or correlationData; cannot continue. ${topic}`
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
  } catch (error) {
    logger.error("Error handling MQTT message", error);
  }
});

// Periodic checks to ensure SignalR connection is maintained
setInterval(() => {
  if (signalRInstance) {
    if (signalRInstance.state === "Connected") {
      logger.info("SignalR is connected");
    } else {
      logger.warn("SignalR not connected, initiating...");
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
