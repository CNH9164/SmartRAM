"""
Simulation Blueprint
Handles simulation REST API endpoints for Hospital Information System Memory Simulation
"""

import re
from flask import Blueprint, request, jsonify
from services.simulator import run_simulation, validate_input

simulation_bp = Blueprint('simulation', __name__, url_prefix='/api')

@simulation_bp.route('/simulate', methods=['POST'])
def simulate():
    """
    Run page replacement simulation

    Expected JSON body:
    {
        "algorithm": "LRU",
        "frames": 3,
        "reference_string": "1, 2, 3, 1, 4, 2, 1, 5, 2, 1"
    }
    """
    try:
        # Get JSON data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request must contain valid JSON'}), 400

        # Validate input
        is_valid, error_msg = validate_input(data)
        if not is_valid:
            return jsonify({'error': error_msg}), 400

        # Process reference string (handles lists, comma-separated, space-separated)
        ref_string = data['reference_string']
        if isinstance(ref_string, str):
            tokens = [x.strip() for x in re.split(r'[\s,]+', ref_string.strip()) if x.strip()]
            ref_string = [int(x) for x in tokens]
        else:
            ref_string = [int(x) for x in ref_string]

        frames = int(data['frames'])
        algorithm = data['algorithm'].upper()

        # Run simulation
        result = run_simulation(algorithm, frames, ref_string)

        return jsonify(result), 200

    except Exception as e:
        return jsonify({'error': f'Simulation failed: {str(e)}'}), 500

@simulation_bp.route('/scenarios', methods=['GET'])
def get_scenarios():
    """
    Return predefined Hospital Information System workload scenarios
    """
    scenarios = [
        {
            'id': 'patient_records',
            'name': 'Patient Records Management',
            'icon': 'fa-hospital-user',
            'badge': 'High Locality',
            'description': 'Simulates repeated access to patient-profile, registration and medical-history page identifiers.',
            'reference_string': '1, 2, 3, 1, 4, 2, 1, 5, 2, 1',
            'frames': 3,
            'explanation': 'Doctors and intake staff frequently revisit patient profile (Page 1) and registration records (Page 2) while updating diagnoses and billing.',
            'page_mappings': {
                '1': 'Patient Profile & Demographics',
                '2': 'Registration & Check-In',
                '3': 'Medical History & Diagnoses',
                '4': 'Insurance & Billing Info',
                '5': 'Clinical Examination Notes'
            }
        },
        {
            'id': 'appointments',
            'name': 'Appointment Management',
            'icon': 'fa-calendar-check',
            'badge': 'Cyclic Lookup',
            'description': 'Simulates access to appointment lists, scheduling pages and associated record pages.',
            'reference_string': '1, 2, 3, 2, 4, 1, 2, 5, 3, 2',
            'frames': 3,
            'explanation': 'Receptionists repeatedly reference physician schedules (Page 2) while navigating master appointment queues and booking time slots.',
            'page_mappings': {
                '1': 'Appointment Master List',
                '2': 'Physician Daily Schedule',
                '3': 'Slot Booking & Rescheduling',
                '4': 'Department Availability',
                '5': 'Patient Notification & Reminders'
            }
        },
        {
            'id': 'laboratory',
            'name': 'Laboratory Information System',
            'icon': 'fa-vial-virus',
            'badge': 'Batch Processing',
            'description': 'Simulates access to test requests, pending-test pages and report-processing pages.',
            'reference_string': '1, 2, 3, 4, 2, 1, 5, 3, 2, 4',
            'frames': 3,
            'explanation': 'Lab technicians cycle between test order queues, pending sample worklists, and diagnostic report verification pipelines.',
            'page_mappings': {
                '1': 'Lab Test Request Queue',
                '2': 'Pending Sample Worklist',
                '3': 'Specimen Barcode Tracking',
                '4': 'Analyzer Interface & Values',
                '5': 'Diagnostic Report Validation'
            }
        },
        {
            'id': 'pharmacy',
            'name': 'Pharmacy Management',
            'icon': 'fa-pills',
            'badge': 'High Frequency',
            'description': 'Simulates access to medicine-inventory, prescription-processing and billing page identifiers.',
            'reference_string': '1, 2, 1, 3, 4, 2, 5, 1, 3, 2',
            'frames': 3,
            'explanation': 'Pharmacists query medicine inventory catalogs (Page 1) and prescription verification queues (Page 2) repeatedly during dispensing.',
            'page_mappings': {
                '1': 'Medicine Formulary & Stock',
                '2': 'Prescription Verification',
                '3': 'Drug Interaction Checker',
                '4': 'Dispense Batch Queue',
                '5': 'Pharmacy Billing & Claims'
            }
        }
    ]
    return jsonify(scenarios), 200
