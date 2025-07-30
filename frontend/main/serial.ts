import { ReadlineParser, SerialPort } from 'serialport';

export interface boardData {
	port: string;
	baudRate: number;
}

export class Serial {
	private _port!: SerialPort;

	private _connected: boolean = false;

	constructor(
		private _data: boardData,
		private _dataFunction: (data: string) => void
	) {
		this._connect();
	}

	getConnected(): boolean {
		return this._connected;
	}

	sendCommand(command: string): void {
		this._port.write(command + '\n');
	}

	private _connect(): void {
		this._port = new SerialPort({
			baudRate: this._data.baudRate,
			path: this._data.port
		});

		this._port.on('open', () => {
			this._connected = true;
			const parser = this._port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

			parser.on('data', this._dataFunction);

			this.extraOpen();
		});

		this._port.on('error', (err) => {
			console.error('Error:', err.message);

			if (this._connected) {
				this._connected = false;
			}

			this._attemptReconnect();

			this.extraError(err);
		});

		this._port.on('close', () => {
			this._connected = false;

			console.log('Disconnected');

			this._attemptReconnect();

			this.extraClose();
		});
	}

	private _attemptReconnect(): void {
		setTimeout(() => {
			this._connect();
		}, 3000);
	}

	extraOpen() {}

	extraError(err: any) {}

	extraClose() {}
}
