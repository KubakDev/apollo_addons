import WebSocket from "ws";
import config from "../utils/config/configLoader";
import Completer from "../utils/completer";

class OnDemandSocket {
  private socket: WebSocket | null = null;
  private onDemandConfig = config.apollo_admin;
  private completers: Map<number, Completer<any>> = new Map();
  private messageIdCounter: number = 1;
  private accessToken: string; // Store the access token

  constructor(access_token: string) {
    if (typeof access_token !== "string" || access_token.trim() === "") {
      throw new Error("Invalid access token");
    }
    this.accessToken = access_token;
    this.startConnection().catch((error) => {
      console.error("Failed to start WebSocket connection:", error);
    });
  }

  /**
   * Asynchronously starts the WebSocket connection using the configuration provided.
   * @returns {Promise<void>}
   */
  async startConnection(): Promise<void> {
    try {
      const socketUrl = new URL(this.onDemandConfig.onDemandSocketPath);
      console.log(`Connecting to onDemand Socket at ${socketUrl.toString()}`);

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
      console.error("Error during WebSocket connection initialization:", error);
      throw error;
    }
  }

  /**
   * Handles the opening of the WebSocket connection.
   * @param resolve - The resolve function of the Promise.
   */
  private handleOpen(resolve: () => void) {
    console.log("onDemand Socket Connection Opened");
    resolve();
  }

  /**
   * Handles incoming messages from the WebSocket connection.
   * @param data - The data received from the WebSocket.
   */
  private async handleMessage(data: WebSocket.Data) {
    try {
      const jsonData = JSON.parse(data.toString());
      // console.log("Message from onDemand:", jsonData);

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
      console.error("Error handling WebSocket message:", error);
    }
  }

  /**
   * Handles errors from the WebSocket connection.
   * @param error - The error object.
   * @param reject - The reject function of the Promise.
   */
  private handleError(error: Error, reject: (reason?: any) => void) {
    console.error("onDemand Socket Error:", error);
    reject(error);
  }

  /**
   * Handles the closing of the WebSocket connection.
   * @param code - The close code.
   * @param reason - The reason for the closure.
   */
  private handleClose(code: number, reason: string) {
    console.log(`onDemand Socket Closed - Code: ${code}, Reason: ${reason}`);
    this.socket = null;
    // Implement reconnection logic here if needed
  }

  /**
   * Asynchronously closes the WebSocket connection, if it is open.
   * @returns {Promise<void>}
   */
  async closeConnection(): Promise<void> {
    if (this.socket) {
      console.log("Closing onDemand Socket Connection");
      return new Promise<void>((resolve, reject) => {
        this.socket!.once("close", (code, reason) => {
          console.log(
            `onDemand Connection closed - Code: ${code}, Reason: ${reason}`
          );
          resolve();
        });
        this.socket!.terminate();
      });
    }
  }

  /**
   * Sends a message and returns a promise that resolves with the response.
   * @param message - The message to send.
   * @param timeout - The timeout duration in milliseconds.
   * @returns {Promise<T>}
   */
  async sendMessage<T>(message: any, timeout = 5000): Promise<T> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not open");
    }

    const id = this.messageIdCounter++;
    message.id = id;

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

  /**
   * Sends an authentication message to the WebSocket server.
   */
  private authenticate() {
    if (this.socket) {
      this.socket.send(
        JSON.stringify({
          type: "auth",
          access_token: this.accessToken,
        })
      );
    }
  }

  /**
   * Waits for the WebSocket connection to be established.
   * @returns {Promise<boolean>}
   */
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

  /**
   * Returns a greeting message from the onDemandSocket.
   * @returns {string}
   */
  public hello(): string {
    return "Hello from onDemandSocket!";
  }
}

export default OnDemandSocket;
