import supervisorSocket from "../infrastructure/sockets/supervisorSocket";
import {supervisorResponse} from "../infrastructure/utils/interfaces";
import { internalResponse } from "../infrastructure/utils/interfaces";
import { formatSuccessResponse, formatErrorResponse } from "../infrastructure/utils/formatResponse";


export async function create_user(
  username: string,
  password: string,
  roleType: string
): Promise<internalResponse> {
  try {
    let configAuthList = { type: "config/auth/list" };
    let response = await supervisorSocket.sendMessage<supervisorResponse>(configAuthList);
    if (!response.success || response.type !== "result") {
      throw Error(response.error);
    }
    response.result.forEach((item: { name: string }) => {
      if (item.name === username) {
        throw Error("User already exists");
      }
    });

    let configAuthCreate = {
      type: "config/auth/create",
      name: username,
      local_only: false,
      group_ids: [roleType === "Owner" ? "system-admin" : "system-users"],
        
    };
    response = await supervisorSocket.sendMessage<supervisorResponse>(configAuthCreate);
    if (!response.success || response.type !== "result" || !response.result.user) {
        throw Error(response.error);
      }
      
      let userID = response.result.user.id
        let configAuthHACreate = {
            type: "config/auth_provider/homeassistant/create",
            user_id: userID,
            username: username,
            password: password,
        };
        response = await supervisorSocket.sendMessage<supervisorResponse>(configAuthHACreate);

        if (!response.success) {
            throw Error(response.error);
          }

          let personCreate = {
            type: "person/create",
            name: username,
            device_trackers: [],
            user_id: userID,
            picture: null,
            
        }
        response = await supervisorSocket.sendMessage<supervisorResponse>(personCreate);
        if (!response.success) {
            throw Error(response.error);
          }
          console.log("User created successfully", response);

    return formatSuccessResponse(null);
  } catch (error: any) {
    console.error("An error occurred during the user creation process:", error);
    return formatErrorResponse(error.message,"-1")
  }
}
