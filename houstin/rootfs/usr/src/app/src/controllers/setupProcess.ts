import config, {
  updatePersistentData,
} from "../infrastructure/utils/config/configLoader";
import { getMAC } from "../services/getMACAddress";
import { getAccessToken } from "../services/user_pass_to_access_token";
import { getLongLiveAccessToken } from "../services/access_token_to_long_live_access";
import { setupApollo } from "../services/setupApollo";
import Elon from "../infrastructure/utils/elonMuskOfLoggers";
/**
 * Main function to handle the setup process.
 */
export async function setupProcess(): Promise<void> {
  try {
    const { isSetup } = config.persistent_data;

    if (!isSetup) {
      // console.log("Setting up for the first time");
      Elon.warn("Setting up for the first time");


      // Get the MAC address of the device
      const macAddress = await getMAC();
      if (!macAddress) {
        throw new Error("MAC address could not be obtained");
      }
      // console.log("MAC address:", macAddress);
      Elon.info("MAC address:", macAddress);

      // Get the access token
      const accessToken = await getAccessToken(
        config.apollo_admin.apolloUsername,
        config.apollo_admin.apolloPassword
      );
      if (!accessToken.success) {
        throw new Error("Access token could not be obtained");
      }

      // Get the long live access token
      const longLiveAccessToken = await getLongLiveAccessToken(
        config.apollo_admin.apolloUsername,
        accessToken.result.accessToken
      );
      if (!longLiveAccessToken.success) {
        throw new Error("Long live access token could not be obtained");
      }

      // console.log("Long live access token:", longLiveAccessToken);
      Elon.info("Long live access token:", longLiveAccessToken);

      // First time setup Apollo
      const response = await setupApollo(macAddress, longLiveAccessToken.result.token);

      if (response) {
        // Update the persistent data
        updatePersistentData({
          isSetup: true,
          superadminToken: longLiveAccessToken.result.token,
        });

        // console.log("Setup complete");
        Elon.warn("Setup complete");
      } else {
        throw new Error("Error in setupApollo");
      }
    } else {
      // console.log("Already setup");
      Elon.warn("Already setup");
    }
  } catch (error) {
    // console.error("Error during setup:", error);
    Elon.error("Error during setup:", error);
  }
}
