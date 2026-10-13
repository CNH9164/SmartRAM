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

@main_bp.route('/workflow-select')
def workflow_select():
    """Render workflow selection page"""
    return render_template('workflow_select.html')

@main_bp.route('/workflow/patient_records')
def workflow_patient_records():
    """Render Patient Records Management workflow page"""
    return render_template('workflow_patient.html')

@main_bp.route('/workflow/appointments')
def workflow_appointments():
    """Render Appointment Management workflow page"""
    return render_template('workflow_appointments.html')

@main_bp.route('/workflow/laboratory')
def workflow_laboratory():
    """Render Laboratory Information System workflow page"""
    return render_template('workflow_laboratory.html')

@main_bp.route('/workflow/pharmacy')
def workflow_pharmacy():
    """Render Pharmacy Management workflow page"""
    return render_template('workflow_pharmacy.html')

@main_bp.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files"""
    static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static')
    return send_from_directory(static_dir, filename)
