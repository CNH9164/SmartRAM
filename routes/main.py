"""
Main Blueprint
Handles general routes (home page, documentation)
"""

from flask import Blueprint, render_template

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """Render home page"""
    return render_template('index.html')

@main_bp.route('/simulator')
def simulator():
    """Render simulator dashboard"""
    return render_template('simulator.html')
