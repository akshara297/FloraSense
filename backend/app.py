
from flask import Flask, request, jsonify, session, redirect, send_from_directory
from pathlib import Path
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import safe_join
import sqlite3
import math
import os
import secrets
import re

app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR.parent / "frontend"
DB_PATH = BASE_DIR / "plant.db"

# Persistent secret key for Flask sessions
SECRET_FILE = BASE_DIR / ".florasense_secret"

if os.environ.get("FLORASENSE_SECRET_KEY"):
    app.secret_key = os.environ["FLORASENSE_SECRET_KEY"]
else:
    if not SECRET_FILE.exists():
        SECRET_FILE.write_text(secrets.token_hex(32))
    app.secret_key = SECRET_FILE.read_text().strip()

app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=False,  # Local HTTP development only
    PERMANENT_SESSION_LIFETIME=timedelta(days=30)
)


# ---------------- TULSI WORKING RANGES ----------------

THRESHOLDS = {
    "soil": {"label": "Soil Moisture", "min": 40, "max": 60, "unit": "%"},
    "temperature": {"label": "Temperature", "min": 20, "max": 30, "unit": "°C"},
    "humidity": {"label": "Humidity", "min": 40, "max": 70, "unit": "%"},
    "light": {"label": "Relative Light", "min": 50, "max": 80, "unit": "%"},
}

REQUIRED_READINGS = 3
violation_counts = {key: 0 for key in THRESHOLDS}


# ---------------- DATABASE ----------------

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    with get_connection() as conn:

        conn.execute("""
            CREATE TABLE IF NOT EXISTS sensor_readings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                soil INTEGER,
                light INTEGER,
                temperature REAL,
                humidity REAL,
                timestamp TEXT NOT NULL
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sensor TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                value REAL NOT NULL,
                unit TEXT NOT NULL,
                severity TEXT NOT NULL DEFAULT 'warning',
                status TEXT NOT NULL DEFAULT 'active',
                created_at TEXT NOT NULL,
                resolved_at TEXT
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                username TEXT NOT NULL COLLATE NOCASE UNIQUE,
                email TEXT NOT NULL COLLATE NOCASE UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)


def valid_number(value):
    if value is None or isinstance(value, bool):
        return None

    try:
        number = float(value)
        return number if math.isfinite(number) else None
    except (TypeError, ValueError):
        return None


# ---------------- AUTHENTICATION HELPERS ----------------

def get_logged_in_user():
    user_id = session.get("user_id")

    if not user_id:
        return None

    with get_connection() as conn:
        return conn.execute(
            "SELECT id, name, username, email, created_at FROM users WHERE id = ?",
            (user_id,)
        ).fetchone()


def user_response(user):
    return {
        "id": user["id"],
        "name": user["name"],
        "username": user["username"],
        "email": user["email"],
        "created_at": user["created_at"]
    }


def valid_text(value, maximum=100):
    return isinstance(value, str) and 0 < len(value.strip()) <= maximum


# ---------------- AUTHENTICATION APIs ----------------

@app.route("/auth/register", methods=["POST"])
def register():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Invalid request."}), 400

    name = data.get("name", "").strip() if isinstance(data.get("name"), str) else ""
    username = data.get("username", "").strip() if isinstance(data.get("username"), str) else ""
    email = data.get("email", "").strip().lower() if isinstance(data.get("email"), str) else ""
    password = data.get("password")

    if not valid_text(name, 100):
        return jsonify({"error": "Enter a valid name."}), 400

    if not re.fullmatch(r"[A-Za-z0-9_.-]{3,30}", username):
        return jsonify({
            "error": "Username must be 3–30 characters and contain only letters, numbers, dots, underscores or hyphens."
        }), 400

    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        return jsonify({"error": "Enter a valid email address."}), 400

    if not isinstance(password, str) or len(password) < 8 or len(password) > 128:
        return jsonify({"error": "Password must contain 8–128 characters."}), 400

    password_hash = generate_password_hash(password)
    timestamp = datetime.now().astimezone().isoformat(timespec="seconds")

    try:
        with get_connection() as conn:
            conn.execute("""
                INSERT INTO users (name, username, email, password_hash, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, (name, username, email, password_hash, timestamp))

    except sqlite3.IntegrityError:
        return jsonify({
            "error": "This username or email is already registered."
        }), 409

    return jsonify({
        "message": "Account created successfully. Please log in."
    }), 201


@app.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Invalid request."}), 400

    email = data.get("email")
    password = data.get("password")

    if not isinstance(email, str) or not isinstance(password, str):
        return jsonify({"error": "Invalid email or password."}), 401

    with get_connection() as conn:
        user = conn.execute(
            "SELECT * FROM users WHERE email = ? COLLATE NOCASE",
            (email.strip(),)
        ).fetchone()

    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid email or password."}), 401

    session.clear()
    session["user_id"] = user["id"]

    if data.get("remember") is True:
        session.permanent = True

    return jsonify({
        "message": "Login successful.",
        "user": user_response(user)
    })


@app.route("/auth/me", methods=["GET"])
def current_user():
    user = get_logged_in_user()

    if not user:
        session.clear()
        return jsonify({"error": "Authentication required."}), 401

    return jsonify({"user": user_response(user)})


@app.route("/auth/profile", methods=["PUT"])
def update_profile():
    user = get_logged_in_user()

    if not user:
        return jsonify({"error": "Authentication required."}), 401

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Invalid request."}), 400

    name = data.get("name", "").strip() if isinstance(data.get("name"), str) else ""
    username = data.get("username", "").strip() if isinstance(data.get("username"), str) else ""
    email = data.get("email", "").strip().lower() if isinstance(data.get("email"), str) else ""

    if not valid_text(name, 100):
        return jsonify({"error": "Enter a valid name."}), 400

    if not re.fullmatch(r"[A-Za-z0-9_.-]{3,30}", username):
        return jsonify({"error": "Enter a valid username."}), 400

    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        return jsonify({"error": "Enter a valid email address."}), 400

    try:
        with get_connection() as conn:
            conn.execute("""
                UPDATE users
                SET name = ?, username = ?, email = ?
                WHERE id = ?
            """, (name, username, email, user["id"]))

            updated = conn.execute(
                "SELECT id, name, username, email, created_at FROM users WHERE id = ?",
                (user["id"],)
            ).fetchone()

    except sqlite3.IntegrityError:
        return jsonify({
            "error": "That username or email is already in use."
        }), 409

    return jsonify({
        "message": "Profile updated successfully.",
        "user": user_response(updated)
    })


@app.route("/auth/change-password", methods=["POST"])
def change_password():
    user = get_logged_in_user()

    if not user:
        return jsonify({"error": "Authentication required."}), 401

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Invalid request."}), 400

    current = data.get("currentPassword")
    new = data.get("newPassword")

    if not isinstance(current, str) or not isinstance(new, str):
        return jsonify({"error": "Enter both passwords."}), 400

    if len(new) < 8 or len(new) > 128:
        return jsonify({"error": "New password must contain 8–128 characters."}), 400

    with get_connection() as conn:
        account = conn.execute(
            "SELECT password_hash FROM users WHERE id = ?",
            (user["id"],)
        ).fetchone()

        if not account or not check_password_hash(account["password_hash"], current):
            return jsonify({"error": "Current password is incorrect."}), 400

        conn.execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            (generate_password_hash(new), user["id"])
        )

    session.clear()

    return jsonify({
        "message": "Password changed successfully. Please log in again."
    })


@app.route("/auth/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully."})


# ---------------- SENSOR CALIBRATION ----------------

def convert_reading(sensor, raw_value):
    if raw_value is None:
        return None

    if sensor == "soil":
        return max(0, min(100, ((3295 - raw_value) / (3295 - 1936)) * 100))

    if sensor == "light":
        return max(0, min(100, ((4095 - raw_value) / (4095 - 2018)) * 100))

    return raw_value


# ---------------- ALERT PROCESSING ----------------

def process_alerts(reading):
    timestamp = datetime.now().astimezone().isoformat(timespec="seconds")

    with get_connection() as conn:
        for sensor, config in THRESHOLDS.items():
            raw_value = reading.get(sensor)
            value = convert_reading(sensor, raw_value)

            if value is None:
                continue

            outside = value < config["min"] or value > config["max"]

            if outside:
                violation_counts[sensor] += 1

                if violation_counts[sensor] >= REQUIRED_READINGS:
                    active = conn.execute(
                        "SELECT id FROM alerts WHERE sensor = ? AND status = 'active'",
                        (sensor,)
                    ).fetchone()

                    if not active:
                        condition = "below" if value < config["min"] else "above"

                        message = (
                            f"{config['label']} is {condition} the recommended range "
                            f"({config['min']}–{config['max']} {config['unit']}). "
                            f"Current reading: {value:.1f} {config['unit']}."
                        )

                        conn.execute("""
                            INSERT INTO alerts
                            (sensor, title, message, value, unit, severity,
                             status, created_at)
                            VALUES (?, ?, ?, ?, ?, 'warning', 'active', ?)
                        """, (
                            sensor,
                            f"{config['label']} out of range",
                            message,
                            value,
                            config["unit"],
                            timestamp
                        ))

            else:
                violation_counts[sensor] = 0

                conn.execute("""
                    UPDATE alerts
                    SET status = 'resolved', resolved_at = ?
                    WHERE sensor = ? AND status = 'active'
                """, (timestamp, sensor))


# ---------------- EXISTING SENSOR APIs ----------------

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "FloraSense API"})


@app.route("/sensor-data", methods=["POST"])
def receive_sensor_data():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "A JSON object is required."}), 400

    soil = valid_number(data.get("soil"))
    light = valid_number(data.get("light"))
    temperature = valid_number(data.get("temperature"))
    humidity = valid_number(data.get("humidity"))

    if soil is None and light is None and temperature is None and humidity is None:
        return jsonify({"error": "No valid sensor values were received."}), 400

    timestamp = datetime.now().astimezone().isoformat(timespec="seconds")

    reading = {
        "soil": soil,
        "light": light,
        "temperature": temperature,
        "humidity": humidity
    }

    with get_connection() as conn:
        cursor = conn.execute("""
            INSERT INTO sensor_readings
            (soil, light, temperature, humidity, timestamp)
            VALUES (?, ?, ?, ?, ?)
        """, (soil, light, temperature, humidity, timestamp))

        reading_id = cursor.lastrowid

    process_alerts(reading)

    return jsonify({
        "message": "Reading saved",
        "id": reading_id,
        "timestamp": timestamp
    }), 201


@app.route("/sensor-data", methods=["GET"])
def get_sensor_data():
    try:
        limit = int(request.args.get("limit", 500))
    except ValueError:
        limit = 500

    limit = max(1, min(limit, 2000))

    with get_connection() as conn:
        rows = conn.execute("""
            SELECT id, soil, light, temperature, humidity, timestamp
            FROM sensor_readings
            ORDER BY id DESC LIMIT ?
        """, (limit,)).fetchall()

    return jsonify([dict(row) for row in rows])


# ---------------- EXISTING ALERT APIs ----------------

@app.route("/alerts", methods=["GET"])
def get_alerts():
    status = request.args.get("status", "all")
    severity = request.args.get("severity", "all")

    query = "SELECT * FROM alerts WHERE 1=1"
    params = []

    if status in ("active", "resolved"):
        query += " AND status = ?"
        params.append(status)

    if severity in ("warning", "critical", "info"):
        query += " AND severity = ?"
        params.append(severity)

    query += " ORDER BY id DESC"

    with get_connection() as conn:
        rows = conn.execute(query, params).fetchall()

    return jsonify([dict(row) for row in rows])


@app.route("/alerts/summary", methods=["GET"])
def alert_summary():
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN severity = 'critical' AND status = 'active' THEN 1 ELSE 0 END) AS critical,
                SUM(CASE WHEN severity = 'warning' AND status = 'active' THEN 1 ELSE 0 END) AS warning,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved
            FROM alerts
        """).fetchone()

    return jsonify({
        "critical": rows["critical"] or 0,
        "warning": rows["warning"] or 0,
        "resolved": rows["resolved"] or 0,
        "total": rows["total"] or 0
    })


# ---------------- FRONTEND + PAGE PROTECTION ----------------

@app.before_request
def protect_pages():
    if request.path.startswith("/pages/"):
        if not get_logged_in_user():
            session.clear()
            return redirect("/")

    if request.path == "/" and get_logged_in_user():
        return redirect("/pages/dashboard.html")


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    requested_file = path or "index.html"

    safe_path = safe_join(str(FRONTEND_DIR), requested_file)

    if not safe_path or not Path(safe_path).is_file():
        return "Page or file not found.", 404

    return send_from_directory(FRONTEND_DIR, requested_file)


# ---------------- START SERVER ----------------

if __name__ == "__main__":
    init_db()
    app.run(host="127.0.0.1", port=5000, debug=False)
