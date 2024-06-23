import WebSocket from "ws";
import config from "../utils/config/configLoader";
import Completer from "../utils/completer";
import { supervisorResponse } from "../utils/interfaces";
import Elon from "../utils/elonMuskOfLoggers";


class SupervisorSocket {
  private static instance: SupervisorSocket;
  private socket: WebSocket | null = null;
  private supervisorConfig = config.apollo_admin;
  private completers: Map<number, Completer<any>> = new Map();
  private messageIdCounter: number = 1;

  // Private constructor to prevent instantiation
  private constructor() {
    this.startConnection().catch((error) => {
      // console.error("Failed to start WebSocket connection:", error);
      Elon.error("Failed to start WebSocket connection:", error);
      
    });
  }

  // Method to get the singleton instance
  public static getInstance(): SupervisorSocket {
    if (!SupervisorSocket.instance) {
      SupervisorSocket.instance = new SupervisorSocket();
    }
    return SupervisorSocket.instance;
  }

  // Asynchronously starts the WebSocket connection using the configuration provided
  private async startConnection(): Promise<void> {
    try {
      const socketUrl = new URL(this.supervisorConfig.supervisorSocketPath);
      // console.log(`Connecting to Supervisor at ${socketUrl.toString()}`);
      Elon.info(`Connecting to Supervisor at ${socketUrl.toString()}`);

      return new Promise<void>((resolve, reject) => {
        this.socket = new WebSocket(socketUrl.toString());

        this.socket.on("open", () => this.handleOpen(resolve));
        this.socket.on("message", (data) => this.handleMessage(data));
        this.socket.on("error", (error) => this.handleError(error, reject));
        this.socket.on("close", (code, reason) =>
          this.handleClose(code, reason.toString())
        );
      });
    } catch (error) {
      // console.error("Error during Supervisor Socket connection initialization:", error);
      Elon.error("Error during Supervisor Socket connection initialization:", error);
      throw error;
    }
  }

  // Handles the opening of the WebSocket connection
  private handleOpen(resolve: () => void) {
    // console.log("Supervisor Socket Connection Opened");
    Elon.warn("Supervisor Socket Connection Opened");
    resolve();
  }

  // Handles incoming messages from the WebSocket connection
  private async handleMessage(data: WebSocket.Data) {
    try {
      const jsonData = JSON.parse(data.toString());
      // console.log("Message from Supervisor:", jsonData);

      if (jsonData.id) {
        const { id } = jsonData;
        const completer = this.completers.get(id);
        if (completer) {
          completer.resolve(jsonData);
          this.completers.delete(id);
        }
      }

      switch (jsonData.type) {
        case "auth_required":
          this.authenticate();
          break;
        default:
          break;
      }
    } catch (error) {
      // console.error("Error handling Supervisor Socket message:", error);
      Elon.error("Error handling Supervisor Socket message:", error);
    }
  }

  // Handles errors from the WebSocket connection
  private handleError(error: Error, reject: (reason?: any) => void) {
    // console.error("Supervisor Socket Error:", error);
    Elon.error("Supervisor Socket Error:", error);
    reject(error);
  }

  // Handles the closing of the WebSocket connection
  private handleClose(code: number, reason: string) {
    // console.log(`Supervisor Socket Closed - Code: ${code}, Reason: ${reason}`);
    Elon.warn(`Supervisor Socket Closed - Code: ${code}, Reason: ${reason}`);
    this.socket = null;
    this.startConnection();
    // Implement reconnection logic here if needed
  }

  // Asynchronously closes the WebSocket connection, if it is open
  public async closeConnection(): Promise<void> {
    if (this.socket) {
      // console.log("Closing Supervisor Socket Connection");
      Elon.warn("Closing Supervisor Socket Connection");
      return new Promise<void>((resolve, reject) => {
        this.socket!.once("close", (code, reason) => {
          // console.log(`Connection closed - Code: ${code}, Reason: ${reason}`);
          Elon.warn(`Connection closed - Code: ${code}, Reason: ${reason}`);
          resolve();
        });
        this.socket!.terminate();
      });
    }
  }

  // Sends a message and returns a promise that resolves with the response
  public async sendMessage<T>(message: object, timeout = 20000): Promise<T> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("Supervisor is not open");
    }

    const id = this.messageIdCounter++;
    (message as any).id = id;

    const completer = new Completer<T>();
    this.completers.set(id, completer);

    this.socket.send(JSON.stringify(message));

    let timeoutHandle = setTimeout(() => {
      this.completers.delete(id); // Clean up the map entry on timeout
      completer.reject(new Error("Timeout waiting for response"));
    }, timeout);

    return completer.future.then(
      (result) => {
        clearTimeout(timeoutHandle);
        return result;
      },
      (error) => {
        clearTimeout(timeoutHandle);
        throw error;
      }
    );
  }

  // Sends an authentication message to the WebSocket server
  private authenticate() {
    if (this.socket) {
      this.socket.send(
        JSON.stringify({
          type: "auth",
          access_token: this.supervisorConfig.supervisorToken,
        })
      );
    }
  }

  // Waits for the WebSocket connection to be established
  public async waitForConnection(): Promise<boolean> {
    const maxAttempts = 30;
    const interval = 1000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    return false;
  }

  // Returns a greeting message from the SupervisorSocket
  public hello(): string {
    return "Hello from SupervisorSocket!";
  }
}

// Export the singleton instance
const supervisorSocket = SupervisorSocket.getInstance();

export default supervisorSocket;
