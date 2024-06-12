import axios from "axios";
import config from "../infrastructure/utils/config/configLoader";
import { internalResponse } from "../infrastructure/utils/interfaces";
import { formatErrorResponse, formatSuccessResponse } from "../infrastructure/utils/formatResponse";

// Function to get access token
export async function getAccessToken(
  username: string,
  password: string
): Promise<internalResponse> {
  try {
    // Step 1: GET auth_providers_uri to fetch providers
    const providersResponse = await axios.get(
      config.apollo_auth.auth_providers_uri
    );
    const providers = providersResponse.data.providers;

    if (providers.length === 0) {
      throw new Error("No authentication providers available.");
    }

    // Step 2: POST to auth_login_flow_uri to initiate login flow
    const loginFlowResponse = await axios.post(
      config.apollo_auth.auth_login_flow_uri,
      {
        client_id: config.apollo_auth.client_id,
        handler: ["homeassistant", null],
        redirect_uri: config.apollo_auth.redirect_uri,
      }
    );

    if (loginFlowResponse.data.type !== "form") {
      throw new Error("Unexpected response type during login flow initiation.");
    }
    const flowId = loginFlowResponse.data.flow_id;

    // Step 3: POST username and password to auth_login_flow_uri/flow_id
    const credentialResponse = await axios.post(
      `${config.apollo_auth.auth_login_flow_uri}/${flowId}`,
      {
        username: username,
        password: password,
        client_id: config.apollo_auth.client_id,
      }
    );

    if (credentialResponse.data.type !== "create_entry") {
      throw new Error("Failed to create entry, please check your credentials.");
    }
    const authCode = credentialResponse.data.result;

    // Step 4: Exchange the authorization code for an access token
    const tokenResponse = await axios.post(
      config.apollo_auth.auth_token_uri,
      `grant_type=authorization_code&code=${authCode}&client_id=${config.apollo_auth.client_id}`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (!tokenResponse.data.access_token) {
      throw new Error(
        "Failed to exchange authorization code for access token."
      );
    }
    // Return the access token
    return formatSuccessResponse({accessToken: tokenResponse.data.access_token});
  } catch (error:any) {
    console.error(
      "An error occurred during the authentication process:",
      error
    );
    return formatErrorResponse(error.message, "-1");
  }
}
