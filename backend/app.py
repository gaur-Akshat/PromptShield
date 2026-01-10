"""
PromptShield Flask Backend
Demo-ready authentication system with Railway MySQL.
"""

import os
import re
from flask import Flask, render_template, request, jsonify, session, redirect
from werkzeug.security import generate_password_hash, check_password_hash

from database import (
    initialize_pool,
    create_tables,
    test_connection,
    execute_one,
    execute_insert
)

# ------------------------------------------------
# App Config
# ------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, "../frontend/templates"),
    static_folder=os.path.join(BASE_DIR, "../frontend/static")
)

app.secret_key = os.getenv("SECRET_KEY", "promptshield-demo-secret")

app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["PERMANENT_SESSION_LIFETIME"] = 86400

print("RUNNING APP:", __file__)

# ------------------------------------------------
# Helpers
# ------------------------------------------------

def success(msg, data=None, code=200):
    res = {"success": True, "message": msg}
    if data:
        res["data"] = data
    return jsonify(res), code

def error(msg, code=400):
    return jsonify({"success": False, "message": msg}), code

# ------------------------------------------------
# Validation
# ------------------------------------------------

def validate_email(email):
    return bool(re.match(r"^[^@]+@[^@]+\.[^@]+$", email))

def validate_username(username):
    return bool(re.match(r"^[a-zA-Z0-9_]{3,50}$", username))

def validate_password(password):
    return len(password) >= 8

# ------------------------------------------------
# Frontend Routes
# ------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/login")
def login_page():
    return render_template("login.html")

@app.route("/signup")
def signup_page():
    return render_template("signup.html")

@app.route("/dashboard")
def dashboard():
    if "user_id" not in session:
        return redirect("/login")
    return render_template("dashboard.html", username=session.get("username"))

# ------------------------------------------------
# API Routes
# ------------------------------------------------

@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json()

    if not data:
        return error("JSON required")

    username = data.get("username","").strip()
    email = data.get("email","").strip().lower()
    password = data.get("password","")

    if not validate_username(username):
        return error("Invalid username")

    if not validate_email(email):
        return error("Invalid email")

    if not validate_password(password):
        return error("Password must be at least 8 characters")

    if execute_one("SELECT id FROM users WHERE username=%s OR email=%s", (username,email)):
        return error("User already exists",409)

    password_hash = generate_password_hash(password)

    user_id = execute_insert(
        "INSERT INTO users (username,email,password_hash) VALUES (%s,%s,%s)",
        (username,email,password_hash)
    )

    session.clear()
    session["user_id"] = user_id
    session["username"] = username
    session.permanent = True

    return success("Signup successful", {"id":user_id,"username":username},201)

# ------------------------------------------------

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data:
        return error("JSON required")

    identifier = data.get("username","").strip()
    password = data.get("password","")

    user = execute_one(
        "SELECT id, username, password_hash FROM users WHERE username=%s OR email=%s",
        (identifier,identifier)
    )

    if not user:
        return error("Invalid credentials",401)

    user_id, username, password_hash = user

    if not check_password_hash(password_hash,password):
        return error("Invalid credentials",401)

    session.clear()
    session["user_id"] = user_id
    session["username"] = username
    session.permanent = True

    return success("Login successful",{"id":user_id,"username":username})

# ------------------------------------------------

@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return success("Logged out")

# ------------------------------------------------

@app.route("/api/check-auth")
def check_auth():
    if "user_id" in session:
        return success("Authenticated",{
            "id":session["user_id"],
            "username":session["username"]
        })
    return jsonify({"authenticated":False}),200

# ------------------------------------------------
# Error Handlers
# ------------------------------------------------

@app.errorhandler(404)
def not_found(e):
    return error("Endpoint not found",404)

@app.errorhandler(500)
def internal(e):
    return error("Internal server error",500)

# ------------------------------------------------
# Initialization
# ------------------------------------------------

_initialized = False

def initialize_app():
    global _initialized
    if _initialized:
        return

    initialize_pool()
    create_tables()

    if not test_connection():
        raise RuntimeError("Database connection failed")

    print("✓ Application initialized")
    _initialized = True

@app.before_request
def before_request():
    if not _initialized:
        initialize_app()

# ------------------------------------------------

if __name__ == "__main__":
    initialize_app()
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)