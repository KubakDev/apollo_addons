const { HubConnectionBuilder, LogLevel } = require("@microsoft/signalr");
const logger = require("./logger");
const { loadConfig } = require("./configManager");

const config = loadConfig();

let signalR;

async function signalRConnection(token) {
  
  try {
    const baseUrlWithToken = `${config.baseUrl}/apollo-hub?access-token=${token}`;
    signalR = new HubConnectionBuilder()
      .withUrl(baseUrlWithToken)
      // .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

      
    await signalR.start();
    logger.info("Connected to SignalR");
    // signalRConnection.onclose(() => {
      // logger.warn("SignalR connection lost. Attempting to reconnect...");
      // setupSignalRConnection(token);
    // });
    
    return signalR;
  } catch (err) {
    logger.error("SignalR connection error", err);
    
    throw err
    
  }
}

async function invokeSignalR(methodName, methodArgs) {
  return await signalR.invoke(methodName, methodArgs);
}

module.exports = {
  signalRConnection,
  invokeSignalR,
};
