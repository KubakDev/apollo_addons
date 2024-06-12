import signalRSocket from "../infrastructure/sockets/signalRSocket";
import { SignalRResponse } from "../infrastructure/sockets/signalRSocket";
export async function setupApollo(
  macAddress: string,
  adminToken: string
): Promise<boolean> {
  const isConnected = await signalRSocket.waitForConnection();
  if (isConnected) {
    // Now we can safely invoke methods on the SignalR connection
    console.log("SignalR connection is ready:");
  } else {
    throw new Error("SignalR connection could not be established");
  }

  const response: SignalRResponse = JSON.parse(await signalRSocket.invoke("setupApollo", {
    macAddress: macAddress,
    adminToken: adminToken,
  }) as string) as SignalRResponse;

  if (!response.success) {
    throw Error(`Error in setupApollo: ${response.error.message}`);
  } else {
    console.log("Apollo setup successful");
    return true;
  }

  return false;

  
}
