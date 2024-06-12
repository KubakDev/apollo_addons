
import signalRSocket from "../infrastructure/sockets/signalRSocket";
import Completer from "../infrastructure/utils/completer";
import {
  formatErrorResponse,
  formatSuccessResponse,
} from "../infrastructure/utils/formatResponse";
import { create_user } from "../services/create_user";
import { getAccessToken } from "../services/user_pass_to_access_token";
import { getLongLiveAccessToken } from "../services/access_token_to_long_live_access";
import { delete_user } from "../services/delete_user";
import { Request, RequestDataUser, RequestDataUserDelete, RequestDataUserWithoutRoleType, internalResponse } from "../infrastructure/utils/interfaces";
import { getRequestProcessor, postRequestProcessor } from "./getAndPostRequestProcessor";


class RequestProcessor {
  private static instance: RequestProcessor;

  private constructor() {
    this.setupListeners();
  }

  private setupListeners(): void {
    signalRSocket.on(
      "Request",
      async (request, completer: Completer<any>) => {
        const processedResponse = await this.processRequest(request);
        completer.resolve(processedResponse);
      }
    );
  }

  // Method to process the request
  private async processRequest(request: Request): Promise<internalResponse> {
    console.log("Processing request:", request);
    
    try {
      
    
    
    // Implement your actual request processing logic here

    let response: any;
    if (!request.hasResult) {
      response = formatSuccessResponse("Request processed");

      switch (request.command) {
        case "POST":
          this.processPostRequest(request);

          break;
        case "GET":
          this.processGetRequest(request);

          break;
        case "create_user":
          this.processCreateUserRequest(request);

          break;

        case "delete_user":
          this.processDeleteUserRequest(request);
          break

        case "update_token":
          this.processUpdateTokenRequest(request);
          break;
        default:
          response = formatErrorResponse("Invalid command", "-3");
      }
    } else {

      
      switch (request.command) {
        
        case "POST":
          response = await this.processPostRequest(request);

          break;
        case "GET":
          response = await this.processGetRequest(request);

          break;
        case "create_user":
          response = await this.processCreateUserRequest(request);

          break;
          case "delete_user":
          response = await this.processDeleteUserRequest(request);
          break

          case "update_token":
          response = await this.processUpdateTokenRequest(request);
          break;
        default:
          response = formatErrorResponse("Invalid command", "-2");
      }
    }

    
    
    return response;
  } catch (error:any) {
      return formatErrorResponse(error.message, "-1");
  }
  }

  private async processPostRequest(request: Request): Promise<internalResponse> {
    // Implement your actual POST request processing logic here
    console.log("Processing POST request:", request);
    return await postRequestProcessor(request);
  }

  private async processGetRequest(request: Request): Promise<internalResponse> {
    // Implement your actual GET request processing logic here
    console.log("Processing GET request:", request);
    return await getRequestProcessor(request);
  }

  private async processCreateUserRequest(request: Request): Promise<internalResponse> {
    // Implement your actual create_user request processing logic here
    console.log("Processing create_user request:", request);
    const { username, password, roleType } = request.data as RequestDataUser;

    try {
      const response = await create_user(
        username,
        password,
        roleType
      );

      if (!response.success) {
        return response;
      }
      const response2 = await getAccessToken(username, password);
      if (!response2.success) {
        return response2;
      }
      const response3 = await getLongLiveAccessToken(
        username,
        response2.result.accessToken
      );
      if (!response3.success) {
        return response3;
      } else {
        return response3;
      }
    } catch (error: any) {
      return formatErrorResponse(error.message, "-0");
    }
  }

  private async processDeleteUserRequest(request: Request): Promise<internalResponse> {
    
    const { username } = request.data as RequestDataUserDelete;
    try {
      const response = await delete_user(username);
      if (!response.success) {
        return response;
      } else {
        return response;
      }
    } catch (error: any) {
      return formatErrorResponse(error.message, "-0");
    }
    
  }

  private async processUpdateTokenRequest(request: Request): Promise<internalResponse> {
    // Implement your actual update_token request processing logic here
    console.log("Processing update_token request:", request);

    const { username, password } = request.data as RequestDataUserWithoutRoleType;

    try {
      const response = await getAccessToken(username, password);
      if (!response.success) {
        return response;
      }
      const response2 = await getLongLiveAccessToken(username, response.result.accessToken);
      if (!response2.success) {
        return response2;
      } else {
        return response2;
      }
    } catch (error: any) {
      return formatErrorResponse(error.message, "-0");
    }
  }



  public static getInstance(): RequestProcessor {
    if (!RequestProcessor.instance) {
      RequestProcessor.instance = new RequestProcessor();
    }
    return RequestProcessor.instance;
  }

  public innit() {}
}

const requestProcessor = RequestProcessor.getInstance();
export default requestProcessor;
