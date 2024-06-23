import time
from quart import Quart, Response, request, jsonify
from quart_cors import cors
from picamera2 import Picamera2
import io
import threading
import picar
from picar import front_wheels, back_wheels
import pigpio

class ObstacleDistanceDetector:
    timeout = 0.05  # the timeout for detecting the echo

    def __init__(self, pi, gpio):
        self.pi = pi
        self.gpio = gpio
        self.pi.set_mode(self.gpio, pigpio.OUTPUT)
        self.pi.write(self.gpio, 0)
        time.sleep(0.1)

    def measure_distance(self):
        self.pi.write(self.gpio, 0)
        time.sleep(0.01)
        self.pi.write(self.gpio, 1)
        time.sleep(0.00001)  # 10µs pulse
        self.pi.write(self.gpio, 0)

        self.pi.set_mode(self.gpio, pigpio.INPUT)

        pulse_start = 0
        pulse_end = 0

        timeout_start = time.time()
        while self.pi.read(self.gpio) == 0:
            pulse_start = time.time()
            if pulse_start - timeout_start > self.timeout:
                return -1

        while self.pi.read(self.gpio) == 1:
            pulse_end = time.time()
            if pulse_end - timeout_start > self.timeout:
                return -1

        if pulse_start != 0 and pulse_end != 0:
            pulse_duration = pulse_end - pulse_start
            distance = int(pulse_duration * 17150)
            if distance < 2 or distance > 100:
                return -1
            return distance
        else:
            return -1

    def get_distance(self, tries=4):
        distances = []
        for _ in range(tries):
            dist = self.measure_distance()
            if dist != -1:
                distances.append(dist)
            time.sleep(0.005)  # small delay between readings

        if distances:
            return sum(distances) // len(distances)
        else:
            return -1  # no valid readings

class Camera:
    def __init__(self):
        self.picam2 = Picamera2()
        self.default_configuration = self.picam2.create_still_configuration(main={"size": (640, 480)})
        self.photo_configuration = self.picam2.create_still_configuration(main={"size": (1280, 720)})
        self.picam2.configure(self.default_configuration)
        self.picam2.start()
        self.frame = None
        self.lock = threading.Lock()
        self.stop_event = threading.Event()
        self.thread = threading.Thread(target=self.update, daemon=True)
        self.thread.start()

    def update(self):
        while not self.stop_event.is_set():
            buffer = io.BytesIO()
            self.picam2.capture_file(buffer, format="jpeg")
            buffer.seek(0)
            with self.lock:
                self.frame = buffer.read()
            time.sleep(0.03)  # capture an image every 30ms

    def get_frame(self):
        with self.lock:
            return self.frame

    def take_photo(self):
        self.picam2.stop()
        self.picam2.configure(self.photo_configuration)
        self.picam2.start()

        buffer = io.BytesIO()
        self.picam2.capture_file(buffer, format="jpeg")
        buffer.seek(0)

        self.picam2.stop()
        self.picam2.configure(self.default_configuration)
        self.picam2.start()

        return buffer

pi = pigpio.pi()
if not pi.connected:
    raise RuntimeError("pigpio daemon is not running. Please start it with 'sudo pigpiod'.")

picar.setup()
fw = front_wheels.Front_Wheels(db='config')
bw = back_wheels.Back_Wheels(db='config')
fw.turning_max = 45

speed = 70
current_angle = 90
angle_step = 5
obstacle_warnings = False

odd = ObstacleDistanceDetector(pi, 20)
distance_value = -1
distance_lock = threading.Lock()
stop_event = threading.Event()

app = Quart(__name__)
app = cors(app, allow_origin="*")

camera = Camera()

def update_distance():
    global distance_value
    while not stop_event.is_set():
        with distance_lock:
            distance_value = odd.get_distance()
        time.sleep(0.5)

distance_thread = None

def start_distance_thread():
    global distance_thread
    if distance_thread is None or not distance_thread.is_alive():
        stop_event.clear()
        distance_thread = threading.Thread(target=update_distance, daemon=True)
        distance_thread.start()

def stop_distance_thread():
    global stop_event, distance_thread
    stop_event.set()
    if distance_thread is not None:
        distance_thread.join()
        distance_thread = None

@app.route('/image')
async def image():
    frame = camera.get_frame()
    return Response(frame, mimetype='image/jpeg')

@app.route('/control', methods=['POST'])
async def control():
    global current_angle, angle_step, speed
    form = await request.form
    command = form['command']
    try:
        if command == 'forward':
            bw.forward()
            bw.speed = speed
        elif command == 'backward':
            bw.backward()
            bw.speed = speed
        elif command == 'left':
            current_angle = max(45, current_angle - angle_step)
            fw.turn(current_angle)
        elif command == 'right':
            current_angle = min(135, current_angle + angle_step)
            fw.turn(current_angle)
        elif command == 'reset':
            current_angle = 90
            fw.turn(current_angle)
        elif command == 'stop':
            bw.stop()
    except Exception as e:
        print(f"Error processing command '{command}': {e}")
    return '', 200

@app.route('/update_settings', methods=['POST'])
async def update_settings():
    global speed, angle_step, obstacle_warnings
    try:
        data = await request.json
        speed = data.get('speed', speed)
        angle_step = data.get('steeringAngleStep', angle_step)
        new_obstacle_warnings = data.get('obstacleWarnings', obstacle_warnings)

        if new_obstacle_warnings and not obstacle_warnings:
            start_distance_thread()
        elif not new_obstacle_warnings and obstacle_warnings:
            stop_distance_thread()

        obstacle_warnings = new_obstacle_warnings

        return jsonify({"status": "success"}), 200
    except Exception as e:
        print(f"Error updating settings: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/get_angle')
async def get_angle():
    global current_angle
    return {'angle': current_angle}, 200

@app.route('/get_distance')
async def get_distance():
    with distance_lock:
        distance = distance_value
    return jsonify({'distance': distance}), 200

@app.route('/take_photo', methods=['POST'])
async def take_photo():
    photo = camera.take_photo()
    return Response(photo.getvalue(), mimetype='image/jpeg')

def cleanup():
    stop_distance_thread()
    camera.stop_event.set()
    fw.turn(90)
    bw.stop()
    pi.stop()
    print("Cleanup: Wheels set to default angle (90), motors stopped, and pigpio daemon stopped.")

@app.before_serving
async def startup():
    if obstacle_warnings:
        start_distance_thread()

@app.after_serving
async def shutdown():
    cleanup()

if __name__ == '__main__':
    try:
        app.run(host='0.0.0.0', port=5000)
    except KeyboardInterrupt:
        cleanup()
        print("Keyboard Interrupt: Wheels set to default angle (90), motors stopped, and pigpio daemon stopped.")
