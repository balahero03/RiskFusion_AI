"""
RiskFusion AI — Full Project Launcher
Run this file to start both the Flask backend and the Vite frontend.

Usage:
    python run.py
"""

import subprocess
import sys
import os
import time
import signal

ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT, "backend")
FRONTEND_DIR = os.path.join(ROOT, "frontend")

processes = []


def cleanup(*_):
    print("\n⏹  Shutting down...")
    for p in processes:
        try:
            p.terminate()
        except Exception:
            pass
    # Give them a moment, then force-kill
    time.sleep(1)
    for p in processes:
        try:
            p.kill()
        except Exception:
            pass
    print("✓  All processes stopped.")
    sys.exit(0)


signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)


def check_prereqs():
    """Ensure node_modules and Python deps exist."""
    node_modules = os.path.join(FRONTEND_DIR, "node_modules")
    if not os.path.isdir(node_modules):
        print("📦  Installing frontend dependencies...")
        subprocess.run("npm install", cwd=FRONTEND_DIR, shell=True, check=True)
        print()

    # Quick check that flask is importable
    try:
        import flask  # noqa: F401
    except ImportError:
        print("📦  Installing backend dependencies...")
        req = os.path.join(BACKEND_DIR, "requirements.txt")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", req], check=True)
        print()


def main():
    print("=" * 52)
    print("   RiskFusion AI — Full Project Launcher")
    print("=" * 52)
    print()

    check_prereqs()

    # --- Start Flask backend ---
    print("🚀  Starting Flask backend  →  http://localhost:5000")
    backend = subprocess.Popen(
        [sys.executable, "app.py"],
        cwd=BACKEND_DIR,
    )
    processes.append(backend)

    # Give Flask a moment to boot
    time.sleep(2)

    # --- Start Vite frontend ---
    print("🚀  Starting Vite frontend  →  http://localhost:5173")
    frontend = subprocess.Popen(
        "npm run dev",
        cwd=FRONTEND_DIR,
        shell=True,
    )
    processes.append(frontend)

    print()
    print("-" * 52)
    print("  Backend  :  http://localhost:5000")
    print("  Frontend :  http://localhost:5173   ← open this")
    print("-" * 52)
    print("  Press Ctrl+C to stop both servers")
    print()

    # Wait for either process to exit
    while True:
        for p in processes:
            ret = p.poll()
            if ret is not None:
                print(f"⚠  Process exited with code {ret}, shutting down...")
                cleanup()
        time.sleep(1)


if __name__ == "__main__":
    main()
