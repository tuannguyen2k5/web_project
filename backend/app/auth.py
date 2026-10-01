import os
import datetime
from functools import wraps
import jwt
from flask import request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash

def get_jwt_secret():
    if current_app:
        return current_app.config.get('JWT_SECRET_KEY') or os.environ.get('JWT_SECRET_KEY', 'default-jwt-secret-key')
    return os.environ.get('JWT_SECRET_KEY', 'default-jwt-secret-key')

def hash_password(password):
    return generate_password_hash(password)

def verify_password(stored_hash, password):
    if not stored_hash or not password:
        return False
    return check_password_hash(stored_hash, password)

def generate_token(user_id, role, hours=24):
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=hours),
        'iat': datetime.datetime.now(datetime.timezone.utc)
    }
    secret = get_jwt_secret()
    return jwt.encode(payload, secret, algorithm='HS256')

def decode_token(token):
    secret = get_jwt_secret()
    try:
        return jwt.decode(token, secret, algorithms=['HS256'])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({
                "error": {
                    "code": "unauthorized",
                    "message": "Vui lòng đăng nhập để tiếp tục.",
                    "details": {}
                }
            }), 401

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({
                "error": {
                    "code": "unauthorized",
                    "message": "Thông tin xác thực không hợp lệ.",
                    "details": {}
                }
            }), 401

        token = parts[1]
        payload = decode_token(token)
        if not payload:
            return jsonify({
                "error": {
                    "code": "unauthorized",
                    "message": "Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.",
                    "details": {}
                }
            }), 401

        # Pass current_user dict with user_id and role
        current_user = {
            'user_id': payload.get('user_id'),
            'role': payload.get('role')
        }
        return f(current_user, *args, **kwargs)
    return decorated

def role_required(*allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated(current_user, *args, **kwargs):
            if current_user.get('role') not in allowed_roles:
                return jsonify({
                    "error": {
                        "code": "forbidden",
                        "message": "Bạn không có quyền thực hiện thao tác này.",
                        "details": {}
                    }
                }), 403
            return f(current_user, *args, **kwargs)
        return decorated
    return decorator
