class Completer<T> {
    private promise: Promise<T>;
    private _resolve!: (value: T | PromiseLike<T>) => void;
    private _reject!: (reason?: any) => void;
  
    constructor() {
      this.promise = new Promise<T>((resolve, reject) => {
        this._resolve = resolve;
        this._reject = reject;
      });
    }
  
    get future(): Promise<T> {
      return this.promise;
    }
  
    resolve(value: T | PromiseLike<T>): void {
      this._resolve(value);
    }
  
    reject(reason?: any): void {
      this._reject(reason);
    }
  }

export default Completer;