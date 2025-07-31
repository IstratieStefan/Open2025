import usb_cdc
import time
import board
import busio
import adafruit_vl53l0x
import digitalio
import pwmio
from adafruit_motor import servo

step1 = digitalio.DigitalInOut(board.GP7)
step1.direction = digitalio.Direction.OUTPUT

dir1 = digitalio.DigitalInOut(board.GP6)
dir1.direction = digitalio.Direction.OUTPUT

serial = usb_cdc.data

command_buffer = ""

base_rotation = 0
sensor_rotation = 0

sensor_distance = 0

scanning = False

pwm = pwmio.PWMOut(board.GP5, duty_cycle=0, frequency=50)

time.sleep(0.5)

ser = servo.Servo(pwm)

ser.angle = 0

start = time.monotonic()


def send(message):
    serial.write(message + "\n")


# Initializing distance sensor
i2c = busio.I2C(scl=board.GP1, sda=board.GP0)

while not i2c.try_lock():
    pass

i2c.unlock()

vl53 = adafruit_vl53l0x.VL53L0X(i2c)

vl53.measurement_timing_budget = 200000

send("STATUS VL53L0X detected. Starting measurements")


# Initializing motors


def step_motor(step_pin, dir_pin, steps, min_delay=0.005, max_delay=0.02, direction=True, ramp_fraction=0.2):
    dir_pin.value = direction
    ramp_steps = int(steps * ramp_fraction)
    run_steps = steps - 2 * ramp_steps

    # Acceleration ramp (slow to fast)
    for i in range(ramp_steps):
        # Linear ramp
        delay = max_delay - (max_delay - min_delay) * (i / ramp_steps)
        step_pin.value = True
        time.sleep(delay)
        step_pin.value = False
        time.sleep(delay)

    # Constant speed
    for i in range(run_steps):
        step_pin.value = True
        time.sleep(min_delay)
        step_pin.value = False
        time.sleep(min_delay)

    # Deceleration ramp (fast to slow)
    for i in range(ramp_steps):
        delay = min_delay + (max_delay - min_delay) * (i / ramp_steps)
        step_pin.value = True
        time.sleep(delay)
        step_pin.value = False
        time.sleep(delay)


def move_base(steps):
    step_motor(step1, dir1, abs(steps), direction=(steps > 0))


time.sleep(1)

move_base(200)


def move_sensor(angle):
    ser.angle = angle


def get_distance():
    global vl53

    return vl53.range - 20


def process_move_command(args):
    global base_rotation, sensor_rotation

    if scanning:
        send("ERROR Can't move manually while scanning")
        return

    try:
        base_angle = int(args[0])
        sensor_angle = int(args[0])

        base_rotation = base_angle
        sensor_rotation = sensor_angle

        send("OK")

    except Exception:
        send(f"ERROR Invalid arguments for process move base command")


def process_status_command():
    global base_rotation, sensor_rotation

    send(f"POS {base_rotation} {sensor_rotation} {get_distance()}")


def process_move_base_command(args):
    global base_rotation

    if scanning:
        send("ERROR Can't move manually while scanning")
        return

    try:
        angle = int(args[0])

        base_rotation = angle

        serial.write("OK\n")

    except Exception:
        send(f"ERROR Invalid arguments for process move base command")


def process_move_sensor_command(args):
    global sensor_rotation

    if scanning:
        send("ERROR Can't move manually while scanning")
        return

    try:
        angle = int(args[0])

        sensor_rotation = angle

        move_sensor(sensor_rotation)

        serial.write("OK\n")

    except Exception:
        send(f"ERROR Invalid arguments for process move base command")


def process_scan_command():
    global scanning, start

    scanning = True

    send("started")

    serial.write("OK\n")


def process_pause_command():
    global scanning

    scanning = False
    serial.write("OK\n")


def process_stop_command():
    global scanning

    scanning = False
    serial.write("OK\n")


def process_reset_command():
    global scanning

    scanning = False

    base_rotation = 0
    sensor_rotation = 0

    sensor_distance = 0

    move_sensor(0)

    serial.write("OK\n")


def parse_and_execute_command(command_line):
    try:
        command_line = command_line.strip()

        if not command_line:
            return

        parts = command_line.split(' ')
        command = parts[0].lower()
        args = parts[1:] if len(parts) > 1 else []

        if command == "status":
            process_status_command()

        elif command == "m_base":
            process_move_base_command(args)

        elif command == "m_sensor":
            process_move_sensor_command(args)

        elif command == "m_all":
            process_move_command(args)

        elif command == "scan":
            process_scan_command()

        elif command == "pause":
            process_pause_command()

        elif command == "start":
            pass
            # process_start_command()

        elif command == "e_stop":
            process_stop_command()

        elif command == "e_cancel":
            pass

        elif command == "reset":
            process_reset_command()

        else:
            send(f"ERROR Unknown command '{command}'")

    except Exception as e:
        send(f"ERROR {e.message}")


def step_scan():
    try:
        global base_rotation, sensor_rotation, scanning

        base_rotation += 5

        move_base(5)

        if base_rotation == 200:
            base_rotation = 0

            sensor_rotation += 5

            move_sensor(sensor_rotation)

            if sensor_rotation == 180:
                scanning = False
                sensor_rotation = 0
                move_sensor(0)

        send(f"POSX {base_rotation} {sensor_rotation} {get_distance()}")


    except Exception as e:
        send("Error")
        send(str(e))


def main():
    global command_buffer, scanning

    while True:
        if serial.in_waiting > 0:
            received = serial.read(serial.in_waiting)

            try:
                data = received.decode('utf-8')
                command_buffer += data

                while '\n' in command_buffer:
                    newline_pos = command_buffer.find('\n')
                    command_line = command_buffer[:newline_pos]
                    command_buffer = command_buffer[newline_pos + 1:]

                    parse_and_execute_command(command_line)

            except UnicodeDecodeError:
                send(b"ERROR: Invalid character encoding")
                command_buffer = ""

        if scanning:
            step_scan()


if __name__ == "__main__":
    send("3D Scanner Controller Ready")
    main()

