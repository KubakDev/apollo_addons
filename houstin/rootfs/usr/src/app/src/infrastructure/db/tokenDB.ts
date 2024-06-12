import Database from "./database";

// Define the interface for TokenState
interface TokenState {
  accessToken: string;
  refreshToken: string;
}

class TokenDB<TokenState> {
  private database: Database<TokenState>;

  constructor() {
    this.database = new Database<TokenState>();
  }

  public async hasState(): Promise<boolean> {
    return this.database.hasState();
  }

  public async getState(): Promise<TokenState | null> {
    const state = await this.database.getState();
    if (state) {
      return state.data;
    }
    return null;
  }

  public async setState(data: TokenState): Promise<TokenState> {
    const newState = await this.database.setState(data);
    return newState.data;
  }

  public async deleteState(): Promise<boolean> {
    return this.database.deleteState();
  }
}

export default TokenDB;
export { TokenState };
