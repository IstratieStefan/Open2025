"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerialHandler = void 0;
const serial_1 = require("./serial");
class SerialHandler {
    constructor(credentials, process) {
        this.serial = new serial_1.Serial(credentials, process);
    }
    sendCommand(command) {
        this.serial.sendCommand(command);
    }
}
exports.SerialHandler = SerialHandler;
