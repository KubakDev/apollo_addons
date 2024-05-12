const { HubConnectionBuilder, LogLevel } = require("@microsoft/signalr");
const logger = require("./logger");
const { loadConfig } = require("./configManager");

const config = loadConfig();

let signalRConnection;

async function setupSignalRConnection(token) {
  try {
    const baseUrlWithToken = `${config.baseUrl}/apollo-hub?access-token=${token}`;
    signalRConnection = new HubConnectionBuilder()
      .withUrl(baseUrlWithToken)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    await signalRConnection.start();
    logger.info("Connected to SignalR");
    signalRConnection.onclose(() => {
      logger.warn("SignalR connection lost. Attempting to reconnect...");
      setupSignalRConnection(token);
    });
    return signalRConnection;
  } catch (err) {
    logger.error("SignalR connection error", err);
    throw err;
  }
}

function invokeSignalRMethod(methodName, methodArgs) {
  return signalRConnection.invoke(methodName, methodArgs);
}

module.exports = {
  setupSignalRConnection,
  invokeSignalRMethod,
};
