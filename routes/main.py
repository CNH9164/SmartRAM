"""
Main Blueprint
Handles general routes (home page, documentation)
"""

from flask import Blueprint, render_template, send_from_directory
import os

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """Render home page"""
    return render_template('index.html')

@main_bp.route('/simulator')
def simulator():
    """Render simulator dashboard"""
    return render_template('simulator.html')

@main_bp.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files"""
    static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static')
    return send_from_directory(static_dir, filename)
