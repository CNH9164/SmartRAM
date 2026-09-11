"""
SmartRAM Application Entry Point
"""

from flask import Flask
from flask_cors import CORS
from routes.main import main_bp
from routes.simulation import simulation_bp

def create_app():
    """Create and configure Flask application"""
    app = Flask(__name__)

    # Enable CORS for development
    CORS(app)

    # Register blueprints
    app.register_blueprint(main_bp)
    app.register_blueprint(simulation_bp)

    return app

if __name__ == '__main__':
    app = create_app()
    print("=" * 60)
    print("  SmartRAM - Page Replacement Simulator Starting...")
    print("  Open http://127.0.0.1:5000 in your browser")
    print("=" * 60)
    app.run(debug=True, port=5000)
