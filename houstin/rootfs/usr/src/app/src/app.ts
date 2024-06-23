import { setupProcess } from "./controllers/setupProcess";
import signalRSocket from "./infrastructure/sockets/signalRSocket";
import requestProcessor from "./controllers/requestProcessor";
import supervisorSocket from "./infrastructure/sockets/supervisorSocket";
import Elon from "./infrastructure/utils/elonMuskOfLoggers";

/**
 * Main function to handle the setup process.
 */
(async () => {
try {
  
  
  await setupProcess();

  const supervisor = await supervisorSocket.waitForConnection();
  if (supervisor) {
    Elon.info("Supervisor connected");
  } else {
    Elon.error("Supervisor connection failed");
  }
  const signalr = await signalRSocket.waitForConnection();
  if (signalr) {
    Elon.info("SignalR connected");
  } else {
    Elon.error("SignalR connection failed");
  }

} catch (error) {
  
  Elon.error("Error in main function");
  
}
  requestProcessor.innit();
})();
