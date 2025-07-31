"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Serial = void 0;
const serialport_1 = require("serialport");
class Serial {
    constructor(_data, _dataFunction) {
        this._data = _data;
        this._dataFunction = _dataFunction;
        this._connected = false;
        this._connect();
    }
    getConnected() {
        return this._connected;
    }
    sendCommand(command) {
        this._port.write(command + '\n');
    }
    _connect() {
        this._port = new serialport_1.SerialPort({
            baudRate: this._data.baudRate,
            path: this._data.port
        });
        this._port.on('open', () => {
            console.log('Connected');
            this._connected = true;
            const parser = this._port.pipe(new serialport_1.ReadlineParser({ delimiter: '\n' }));
            parser.on('data', (data) => {
                console.log(data);
                this._dataFunction(data);
            });
        });
        this._port.on('error', (err) => {
            console.error('Error:', err.message);
            if (this._connected) {
                this._connected = false;
            }
            this._attemptReconnect();
        });
        this._port.on('close', () => {
            this._connected = false;
            console.log('Disconnected');
            this._attemptReconnect();
        });
    }
    _attemptReconnect() {
        setTimeout(() => {
            this._connect();
        }, 3000);
    }
}
exports.Serial = Serial;
