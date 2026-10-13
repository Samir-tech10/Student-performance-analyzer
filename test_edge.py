import subprocess
import time
import urllib.request
import json
import asyncio
import sys

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
file_url = "file:///C:/Users/LENOVO/.gemini/antigravity/scratch/student-performance-analyzer/index.html"

proc = subprocess.Popen([
    edge_path,
    "--headless",
    "--remote-debugging-port=9222",
    "--disable-gpu",
    "--user-data-dir=C:/Users/LENOVO/.gemini/antigravity/scratch/student-performance-analyzer/edge_temp_profile",
    file_url
])

time.sleep(2)

try:
    resp = urllib.request.urlopen("http://127.0.0.1:9222/json")
    tabs = json.loads(resp.read().decode())
    target = [t for t in tabs if t.get('type') == 'page'][0]
    print("Page found:", target.get('url'))
    ws_url = target.get('webSocketDebuggerUrl')
    print("WS URL:", ws_url)
except Exception as e:
    print("Error connecting:", e)
finally:
    proc.terminate()
