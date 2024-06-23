import TransportStream from 'winston-transport';
import axios from 'axios';
import Elon from './elonMuskOfLoggers';

interface HttpTransportOptions extends TransportStream.TransportStreamOptions {
  url: string;
}

class HttpTransport extends TransportStream {
  private url: string;

  constructor(opts: HttpTransportOptions) {
    super(opts);
    this.url = opts.url;
  }

  log(info: any, callback: () => void) {
    setImmediate(() => this.emit('logged', info));

    axios.post(this.url, info)
      .then(() => callback())
      .catch((error: any) => {
        // console.error('Failed to send log:', error);
        Elon.error('Failed to send log:', error);
        callback();
      });
  }
}

export default HttpTransport;
