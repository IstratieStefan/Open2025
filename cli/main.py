import serial
import serial.tools.list_ports
import threading
import time


class ScannerInterface:
    def __init__(self):
        self.serial_connection = None
        self.running = False
        self.receive_thread = None

    def list_serial_ports(self):
        ports = serial.tools.list_ports.comports()
        print("\nAvailable serial ports:")
        for i, port in enumerate(ports):
            print(f"{i + 1}: {port.device} - {port.description}")
        return ports

    def connect(self, port=None, baudrate=115200):
        if port is None:
            ports = self.list_serial_ports()
            if not ports:
                print("No serial ports found!")
                return False

            try:
                choice = int(input("\nSelect port number: ")) - 1
                port = ports[choice].device
            except (ValueError, IndexError):
                print("Invalid selection!")
                return False

        try:
            self.serial_connection = serial.Serial(port, baudrate, timeout=1)
            time.sleep(2)
            print(f"Connected to {port} at {baudrate} baud")

            self.running = True
            self.receive_thread = threading.Thread(target=self.receive_messages, daemon=True)
            self.receive_thread.start()

            return True
        except serial.SerialException as e:
            print(f"Failed to connect: {e}")
            return False

    def receive_messages(self):
        while self.running and self.serial_connection:
            try:
                if self.serial_connection.in_waiting > 0:
                    message = self.serial_connection.readline().decode('utf-8').strip()
                    if message:
                        print(f"\n[Pico]: {message}")
                        print(">> ", end="", flush=True)
                time.sleep(0.1)
            except Exception as e:
                if self.running:
                    print(f"\nReceive error: {e}")
                break

    def send_command(self, command):
        if not self.serial_connection:
            print("Not connected to scanner!")
            return False

        try:
            if not command.endswith('\n'):
                command += '\n'

            self.serial_connection.write(command.encode('utf-8'))
            return True
        except Exception as e:
            print(f"Send error: {e}")
            return False

    def disconnect(self):
        self.running = False
        if self.serial_connection:
            self.serial_connection.close()
            self.serial_connection = None
        print("\nDisconnected from scanner.")

    def show_help(self):
        print("\n=== Scanner Interface Commands ===")
        print("help          - Show this help")
        print("connect       - Connect to scanner")
        print("disconnect    - Disconnect from scanner")
        print("quit/exit     - Exit the interface")
        print("\n=== Scanner Commands (when connected) ===")
        print("scan <args>      - Send scan command")
        print("calibrate <args> - Send calibrate command")
        print("status           - Get scanner status")
        print("help             - Get scanner help")
        print("\nType any command and press Enter to send it to the scanner.")

    def run(self):
        print("=== 3D Scanner Interface ===")
        print("Type 'help' for available commands or 'connect' to start")

        while True:
            try:
                command = input(">> ").strip()

                if not command:
                    continue

                if command.lower() in ['quit', 'exit']:
                    break
                elif command.lower() == 'help':
                    self.show_help()
                elif command.lower() == 'connect':
                    self.connect()
                elif command.lower() == 'disconnect':
                    self.disconnect()
                else:
                    # Send command to scanner
                    if self.serial_connection:
                        self.send_command(command)
                    else:
                        print("Not connected! Type 'connect' first.")

            except KeyboardInterrupt:
                print("\nExiting...")
                break
            except EOFError:
                print("\nExiting...")
                break

        self.disconnect()


def main():
    interface = ScannerInterface()
    interface.run()


if __name__ == "__main__":
    main()
