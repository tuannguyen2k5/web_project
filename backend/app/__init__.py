import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from .database import close_db, init_db, seed_db, get_db_path
from .routes import api_bp

load_dotenv()

def create_app(test_config=None):
    app = Flask(__name__)

    # Default configuration
    app.config.from_mapping(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'default-dev-secret-key-32768'),
        JWT_SECRET_KEY=os.environ.get('JWT_SECRET_KEY', 'default-jwt-secret-key-clinic'),
        DATABASE_URL=os.environ.get('DATABASE_URL', 'clinic.db'),
    )

    if test_config:
        app.config.update(test_config)

    # Enable CORS for React frontend (Vite :5173 and others)
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Register Blueprint with prefix /api
    app.register_blueprint(api_bp, url_prefix='/api')

    # Close DB connection at teardown
    app.teardown_appcontext(close_db)

    # Standard JSON error handlers
    @app.errorhandler(400)
    def handle_bad_request(e):
        return jsonify({
            "error": {
                "code": "bad_request",
                "message": getattr(e, 'description', 'Yêu cầu không hợp lệ.'),
                "details": {}
            }
        }), 400

    @app.errorhandler(404)
    def handle_not_found(e):
        return jsonify({
            "error": {
                "code": "not_found",
                "message": getattr(e, 'description', 'Không tìm thấy dữ liệu yêu cầu.'),
                "details": {}
            }
        }), 404

    @app.errorhandler(405)
    def handle_method_not_allowed(e):
        return jsonify({
            "error": {
                "code": "method_not_allowed",
                "message": "Phương thức yêu cầu không được hỗ trợ.",
                "details": {}
            }
        }), 405

    @app.errorhandler(500)
    def handle_internal_server_error(e):
        return jsonify({
            "error": {
                "code": "internal_server_error",
                "message": "Đã có lỗi xảy ra từ hệ thống, vui lòng thử lại sau.",
                "details": {}
            }
        }), 500

    # Auto-initialize DB if not yet created
    with app.app_context():
        db_path = get_db_path()
        if not os.path.exists(db_path):
            try:
                init_db(db_path)
                seed_db(db_path)
            except Exception as ex:
                print(f"[create_app] Database initialization notice: {ex}")

    return app
