"""
SmartRAM Application Entry Point
"""

import os
from flask import Flask
from flask_cors import CORS
from routes.main import main_bp
from routes.simulation import simulation_bp

def create_app():
    """Create and configure Flask application"""
    base_dir = os.path.abspath(os.path.dirname(__file__))
    template_dir = os.path.join(base_dir, 'templates')
    static_dir = os.path.join(base_dir, 'static')

    app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)

    # Enable CORS for development
    CORS(app)

    # Register blueprints
    app.register_blueprint(main_bp)
    app.register_blueprint(simulation_bp)

    return app

# Create app instance for Vercel
app = create_app()

if __name__ == '__main__':
    print("=" * 60)
    print("  SmartRAM - Page Replacement Simulator Starting...")
    print("  Open http://127.0.0.1:5000 in your browser")
    print("=" * 60)
    app.run(debug=True, port=5000)
