import { BoardData, Serial } from './serial';

export class SerialHandler {
	private serial!: Serial;

	constructor(credentials: BoardData, process: (data: string) => void) {
		this.serial = new Serial(
			credentials,
			process
		);
	}

	sendCommand(command: string) {
		this.serial.sendCommand(command);
	}
}
