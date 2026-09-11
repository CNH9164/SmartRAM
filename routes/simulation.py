"""
Simulation Blueprint
Handles simulation REST API endpoints
"""

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
        "reference_string": [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2]
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

        # Process reference string if it's a string
        ref_string = data['reference_string']
        if isinstance(ref_string, str):
            ref_string = [int(x.strip()) for x in ref_string.split() if x.strip()]
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
    Return predefined real-world scenarios
    """
    scenarios = [
        {
            'id': 'browser',
            'name': 'Web Browser (Heavy Multi-tab)',
            'description': 'Simulates browsing with multiple tabs open, switching between search, docs, video, and social media.',
            'reference_string': '1 2 3 4 1 2 5 1 2 3 4 5',
            'frames': 4,
            'explanation': 'Demonstrates temporal locality where recently opened tabs are revisited frequently.'
        },
        {
            'id': 'video_player',
            'name': 'Video Streaming App',
            'description': 'Simulates sequential frame loading with occasional seeking back and forth.',
            'reference_string': '1 2 3 4 5 6 7 8 2 3 4 9 10',
            'frames': 3,
            'explanation': 'Shows streaming behavior where pages are accessed sequentially with occasional jumps.'
        },
        {
            'id': 'database',
            'name': 'Database Query Processing',
            'description': 'Simulates index lookups and table scans with repeated access to index root pages.',
            'reference_string': '0 1 0 2 0 3 0 4 0 5 1 2',
            'frames': 3,
            'explanation': 'Shows hot pages (index roots) that are accessed repeatedly interspersed with cold data pages.'
        },
        {
            'id': 'belady',
            'name': "Belady's Anomaly Demo (FIFO Flaw)",
            'description': 'Classic reference string that shows Belady\'s Anomaly where increasing frames from 3 to 4 increases page faults in FIFO!',
            'reference_string': '1 2 3 4 1 2 5 1 2 3 4 5',
            'frames': 3,
            'explanation': 'Run with FIFO: 3 frames gives 9 faults, but 4 frames gives 10 faults! An iconic OS concept.'
        }
    ]
    return jsonify(scenarios), 200
