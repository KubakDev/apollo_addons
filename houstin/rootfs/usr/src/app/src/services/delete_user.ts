import supervisorSocket from "../infrastructure/sockets/supervisorSocket";
import { supervisorResponse } from "../infrastructure/utils/interfaces";
import { internalResponse } from "../infrastructure/utils/interfaces";
import {
  formatErrorResponse,
  formatSuccessResponse,
} from "../infrastructure/utils/formatResponse";
import Elon from "../infrastructure/utils/elonMuskOfLoggers";

export async function delete_user(username: string): Promise<internalResponse> {
  try {
    let configAuthList = { type: "config/auth/list" };
    let response1 = await supervisorSocket.sendMessage<supervisorResponse>(
      configAuthList
    );
    // console.log("response1", response1);

    if (!response1.success || response1.type !== "result") {
      throw Error(response1.error);
    }

    let userId: string | undefined;
    response1.result.forEach((user: { name: string; id: string }) => {
      // console.log(user.name);
      if (user.name === username) {
        userId = user.id;
      }
    });

    if (!userId) {
      throw new Error("User not found");
    }
    let personDelete = {
      type: "person/delete",
      person_id: username.toLowerCase(),
    };
    let response2 = await supervisorSocket.sendMessage<supervisorResponse>(
      personDelete
    );

    // console.log("response2", response2);
    if (!response2.success) {
      // console.log("ee wtf",response2.error);
      
      throw Error(response2.error);
    }

    let configAuthDelete = {
      type: "config/auth/delete",
      user_id: userId,
    };
    let response3 = await supervisorSocket.sendMessage<supervisorResponse>(
      configAuthDelete
    );
    // console.log("response3", response3);
    if (!response3.success) {
      throw Error(response3.error);
    } else {
      // console.log("User deleted successfully", response3);
      Elon.warn("User deleted successfully", response3);
      return formatSuccessResponse(null);
    }
  } catch (error: any) {
    Elon.error("Error in delete_user", error);
  
    return formatErrorResponse(error.message, "-0");
  }
}
