import supervisorSocket from "../infrastructure/sockets/supervisorSocket";
import { supervisorResponse } from "../infrastructure/utils/interfaces";

export async function getMAC(): Promise<string|null> {
    let ethernetMAC = null;

  try {
    let networkInfo = {
        type: "supervisor/api",
        endpoint: "/network/info",
        method: "get",
      };
      const isConnected = await supervisorSocket.waitForConnection();
      if (!isConnected) {
        throw new Error("Supervisor connection could not be established");
      }
    
      let response = await supervisorSocket.sendMessage<supervisorResponse>(networkInfo);
      if (!response.success || response.type !== "result") {
        throw Error(response.error);
      }
    
      response.result.interfaces.forEach((interface_: { mac: string, type: string }) => {
        if (interface_.type === "ethernet") {
          ethernetMAC = interface_.mac;
        }
      });
      
      return ethernetMAC
    
  } catch (error) {
    console.log(error);
    
    return ethernetMAC;
  }
}
