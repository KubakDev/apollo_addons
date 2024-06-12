import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { EventEmitter } from "events";
import config from "../utils/config/configLoader";
import TokenDB from "../db/tokenDB";
import { TokenState } from "../db/tokenDB";
import Completer from "../utils/completer";
import { log } from "console";
import { formatSuccessResponse, formatErrorResponse } from "../utils/formatResponse";

interface JwtPayload {
  exp: number;
}

interface SignalRResponse {
  result: any;
  success: boolean;
  error: any;
}
class SignalRSocket extends EventEmitter {
  private static instance: SignalRSocket;
  private connection: HubConnection | null = null;
  private tokenDB = new TokenDB<TokenState>();

  // Private constructor to prevent instantiation
  private constructor() {
    super();
    this.initConnection();
  }

  // Method to get the singleton instance
  public static getInstance(): SignalRSocket {
    if (!SignalRSocket.instance) {
      SignalRSocket.instance = new SignalRSocket();
    }
    return SignalRSocket.instance;
  }

  // Initialize the SignalR connection
  private async initConnection(): Promise<void> {
    try {
      await this.reAuthenticate();
      await this.startConnection();
    } catch (error) {
      console.error("Error initializing SignalR connection:", error);
    }
  }

  // Re-authenticate to get a new token
  private async reAuthenticate(): Promise<void> {
    try {
      const loginResponse = await this.login();
      if (!loginResponse) {
        throw new Error("Login returned false");
      }
    } catch (error) {
      console.error("Error in reAuthenticate", error);
    }
  }

  // Start the SignalR connection
  private async startConnection(): Promise<void> {
    try {
      const token = await this.tokenDB.getState();
      const baseUrlWithToken = `${config.apollo_admin.baseUrl}/apollo-hub?access-token=${token?.accessToken}`;
      console.log("Connecting to SignalR at", baseUrlWithToken);

      this.connection = new HubConnectionBuilder()
        .withUrl(baseUrlWithToken)
        .build();

      this.connection.on("reconnected", this.handleReconnected);
      this.connection.onclose(this.handleConnectionClose);
      this.connection.on("Request", async (data) => {
        return await this.handleRequest(data);
      }); // Handle "Request" messages

      await this.connection.start();
      console.log("SignalR connection started");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          if (error.response.status === 401) {
            console.log("401 Unauthorized, re-authenticating...");
            await this.reAuthenticate();
            await this.startConnection();
          } else if (
            error.response.status >= 500 &&
            error.response.status < 600
          ) {
            console.log("Server error, retrying in 5 seconds...");
            setTimeout(() => this.startConnection(), 5000);
          } else {
            console.error(
              `Error starting SignalR connection: ${error.response.status}`,
              error.response.data
            );
          }
        } else if (error.request) {
          console.error("No response received from server", error.request);
        } else {
          console.error("Error in request setup", error.message);
        }
      } else {
        console.error("Non-Axios error", error);
      }
    }
  }

  // Handle login and retrieve tokens
  private async login(): Promise<boolean> {
    try {
      const response = await axios.post(
        `${config.apollo_admin.baseUrl}${config.apollo_admin.loginPath}`,
        {
          username: config.apollo_admin.apolloUsername,
          password: config.apollo_admin.apolloPassword,
        }
      );
      await this.tokenDB.setState({
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      });

      return true;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(
            `Error in login with status: ${error.response.status}: ${error.response.data}`
          );
        } else if (error.request) {
          throw new Error(
            "Error in login: No response received from the server."
          );
        } else {
          throw new Error(`Error in login: ${error.message}`);
        }
      } else {
        throw new Error(`Error in login: Non-Axios error`);
      }
    }
  }

  // Handle SignalR reconnected event
  private handleReconnected = async (): Promise<void> => {
    console.log("SignalR reconnected");
  };

  // Handle SignalR connection close event
  private handleConnectionClose = async (): Promise<void> => {
    console.log("SignalR connection closed, restarting...");
    await this.startConnection();
  };

  // Handle "Request" messages from SignalR
  private handleRequest = async (request: any): Promise<SignalRResponse> => {
    const completer = new Completer<any>();
    this.emit("Request", request, completer);

    try {
      const response = await completer.future;
      console.log("Response from request processor", await response);

      return await response;
    } catch (error: any) 
    {
      
      return formatErrorResponse(error.message, "-1");
      
    }
  };

  // Invoke a method through SignalR
  public async invoke<T>(methodName: string, ...args: any[]): Promise<T> {
    if (!this.connection) {
      throw new Error("Connection not established");
    }
    return this.connection.invoke<T>(methodName, ...args);
  }



  // Wait for the connection to be established
  public async waitForConnection(): Promise<boolean> {
    const maxAttempts = 30; // Maximum number of attempts
    const interval = 1000; // Interval between attempts in milliseconds

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (this.connection && this.connection.state === "Connected") {
        return true; // Return true if connected
      }
      await new Promise((resolve) => setTimeout(resolve, interval)); // Wait for the specified interval
    }

    return false; // Return false if not connected after all attempts
  }
}

// Export the singleton instance
const signalRSocket = SignalRSocket.getInstance();

export default signalRSocket;
export { SignalRResponse };
