import subprocess
import time
import os
import signal

def verify_startup():
    print("Attempting to start server...")
    try:
        process = subprocess.Popen(["uv", "run", "."], cwd=os.path.dirname(__file__), stdout=subprocess.PIPE, stderr=subprocess.PIPE, start_new_session=True)
        time.sleep(5)  # Give server time to start

        if process.poll() is not None:
            print("Server failed to start or exited early.")
            stdout, stderr = process.communicate()
            print("STDOUT:", stdout.decode())
            print("STDERR:", stderr.decode())
            return False
        else:
            print("Server seems to be running. Terminating...")
            os.killpg(os.getpgid(process.pid), signal.SIGTERM)
            try:
                process.communicate(timeout=5)
            except subprocess.TimeoutExpired:
                os.killpg(os.getpgid(process.pid), signal.SIGKILL)
                print("Server force killed.")
            print("Server startup check passed.")
            return True
    except Exception as e:
        print(f"Error during server startup check: {e}")
        return False

if __name__ == "__main__":
    if not verify_startup():
        exit(1)
