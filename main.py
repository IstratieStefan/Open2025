import time
import board
import busio
import adafruit_vl53l0x

# Wait for power stability
time.sleep(0.5)

# Initialize I2C
i2c = busio.I2C(scl=board.GP1, sda=board.GP0)

# Wait until I2C is ready
while not i2c.try_lock():
    pass
i2c.unlock()  # Immediately unlock after checking it's ready

# Create sensor object (let the library manage locking)
vl53 = adafruit_vl53l0x.VL53L0X(i2c)

# Optional: set timing budget (how long the sensor spends measuring)
vl53.measurement_timing_budget = 200000  # microseconds

print("VL53L0X detectat. Încep măsurătorile...\n")

while True:
    distance_mm = vl53.range - 20
    print("Distanta: {} mm".format(distance_mm))
    time.sleep(0.5)
