import { setupProcess } from "./controllers/setupProcess";
import signalRSocket from "./infrastructure/sockets/signalRSocket";
import requestProcessor from "./controllers/requestProcessor";
import supervisorSocket from "./infrastructure/sockets/supervisorSocket";
import Elon from "./infrastructure/utils/elonMuskOfLoggers";

/**
 * Main function to handle the setup process.
 */
(async () => {

  Elon
  await setupProcess();

  const supervisor = await supervisorSocket.waitForConnection();
  if (supervisor) {
    console.log("Supervisor connected");
  } else {
    console.error("Supervisor connection failed");
  }
  const signalr = await signalRSocket.waitForConnection();
  if (signalr) {
    console.log("SignalR connected");
  } else {
    console.error("SignalR connection failed");
  }

  requestProcessor.innit();
})();
