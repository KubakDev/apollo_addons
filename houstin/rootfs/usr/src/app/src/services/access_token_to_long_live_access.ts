import { get } from "http";
import OnDemandSocket from "../infrastructure/sockets/onDemandSocket";
import { supervisorResponse } from "../infrastructure/utils/interfaces";
import { internalResponse } from "../infrastructure/utils/interfaces";

import {
  formatSuccessResponse,
  formatErrorResponse,
} from "../infrastructure/utils/formatResponse";
import Elon from "../infrastructure/utils/elonMuskOfLoggers";

function getTokenId(
  data: any,
  type: string,
  clientName: string
): string | null {
  for (const item of data.result) {
    if (item.type === type && item.client_name === clientName) {
      return item.id;
    }
  }
  return null; // Return null if no matching token is found
}

export async function getLongLiveAccessToken(
  name: string,
  accessToken: string
): Promise<internalResponse> {
  try {
    const onDemandSocket = new OnDemandSocket(accessToken);
    const isConnected = await onDemandSocket.waitForConnection();
    if (isConnected) {
      let createToken = {
        type: "auth/long_lived_access_token",
        lifespan: 3650,
        client_name: name,
      };

      let getToken = { type: "auth/refresh_tokens" };

      let deleteToken = {
        type: "auth/delete_refresh_token",
        refresh_token_id: "",
      };

      const response = await onDemandSocket.sendMessage(getToken);

      const tokenId = getTokenId(response, "long_lived_access_token", name);

      if (tokenId) {
        deleteToken.refresh_token_id = tokenId;
        await onDemandSocket.sendMessage(deleteToken);
      }
      const result = await onDemandSocket.sendMessage<supervisorResponse>(
        createToken
      );

      onDemandSocket.closeConnection();

      return formatSuccessResponse({ token: result.result });
    } else {
      throw new Error("OnDemand connection could not be established");
    }
  } catch (error: any) {
    // console.error(
    //   "An error occurred during the Long Live Acess Token process:",
    //   error
    // );
    Elon.error(
      "An error occurred during the Long Live Acess Token process:",
      error
    );
    return formatErrorResponse(error.message, "-1");
  }
}
