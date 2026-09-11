"""
Simulation Service
Handles simulation logic and coordinates algorithm execution
"""

from algorithms import fifo, lru, optimal

def run_simulation(algorithm, frames, reference_string):
    """
    Run page replacement simulation with the specified algorithm

    Args:
        algorithm: Algorithm name ('FIFO', 'LRU', 'OPTIMAL', 'ALL')
        frames: Number of frames available
        reference_string: List of page numbers

    Returns:
        Simulation result(s)
    """
    # Map algorithm names to their modules
    algorithm_map = {
        'FIFO': fifo,
        'LRU': lru,
        'OPTIMAL': optimal
    }

    if algorithm == 'ALL':
        # Run all algorithms for comparison
        results = []
        for algo_name, algo_module in algorithm_map.items():
            result = algo_module.simulate(reference_string, frames)
            results.append(result)

        # Find the best performing algorithm (lowest page faults)
        best_algo = min(results, key=lambda x: x['page_faults'])

        return {
            'comparison': True,
            'results': results,
            'best_algorithm': best_algo['algorithm'],
            'best_page_faults': best_algo['page_faults']
        }
    else:
        # Run single algorithm
        algo_module = algorithm_map.get(algorithm.upper())
        if not algo_module:
            raise ValueError(f"Unknown algorithm: {algorithm}")

        return algo_module.simulate(reference_string, frames)

def validate_input(data):
    """
    Validate simulation input parameters

    Args:
        data: Dictionary containing algorithm, frames, and reference_string

    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check required fields
    if 'algorithm' not in data:
        return False, "Algorithm is required"

    if 'frames' not in data:
        return False, "Number of frames is required"

    if 'reference_string' not in data:
        return False, "Reference string is required"

    # Validate frames
    try:
        frames = int(data['frames'])
        if frames <= 0:
            return False, "Number of frames must be positive"
        if frames > 10:
            return False, "Number of frames cannot exceed 10"
    except (ValueError, TypeError):
        return False, "Number of frames must be a valid integer"

    # Validate reference string
    reference_string = data['reference_string']

    if isinstance(reference_string, str):
        # Parse string to list
        try:
            reference_string = [int(x.strip()) for x in reference_string.split() if x.strip()]
        except ValueError:
            return False, "Reference string must contain only numbers"

    if not isinstance(reference_string, list):
        return False, "Reference string must be a list or space-separated string"

    if len(reference_string) == 0:
        return False, "Reference string cannot be empty"

    if len(reference_string) > 100:
        return False, "Reference string cannot exceed 100 elements"

    # Check all elements are non-negative integers
    for page in reference_string:
        try:
            page_num = int(page)
            if page_num < 0:
                return False, "Page numbers must be non-negative"
            if page_num > 99:
                return False, "Page numbers must be less than 100"
        except (ValueError, TypeError):
            return False, "All page references must be valid integers"

    # Validate algorithm
    valid_algorithms = ['FIFO', 'LRU', 'OPTIMAL', 'ALL']
    if data['algorithm'].upper() not in valid_algorithms:
        return False, f"Algorithm must be one of: {', '.join(valid_algorithms)}"

    return True, None
