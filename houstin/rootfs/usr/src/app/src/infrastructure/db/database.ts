interface State<T> {
    data: T;
    createdAt: Date;
  }
  
  class Database<T> {
    private state: State<T> | null;
  
    constructor() {
      this.state = null;
    }
  
    // Method to check if the state exists
    public async hasState(): Promise<boolean> {
      return this.state !== null;
    }
  
    // Create or update the state
    public async setState(data: T): Promise<State<T>> {
      const now = new Date();
      const newState: State<T> = { data, createdAt: now };
      this.state = newState;
      return newState;
    }
  
    // Read the state
    public async getState(): Promise<State<T> | null> {
      return this.state;
    }
  
    // Delete the state
    public async deleteState(): Promise<boolean> {
      if (this.state) {
        this.state = null;
        return true;
      }
      return false;
    }
  }
  
  export default Database;
  