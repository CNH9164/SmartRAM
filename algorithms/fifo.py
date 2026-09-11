"""
FIFO (First In First Out) Page Replacement Algorithm
Replaces the oldest page in memory (the one that arrived first)
"""

def simulate(reference_string, num_frames):
    """
    Simulate FIFO page replacement algorithm

    Args:
        reference_string: List of page numbers
        num_frames: Number of available frames in memory

    Returns:
        Dictionary containing simulation results
    """
    frames = []
    page_faults = 0
    page_hits = 0
    steps = []
    queue = []  # Track order of page arrival

    for step_num, page in enumerate(reference_string, 1):
        # Check if page is already in memory (HIT)
        if page in frames:
            page_hits += 1
            steps.append({
                'step': step_num,
                'requested_page': page,
                'frames': frames.copy(),
                'result': 'HIT',
                'replaced_page': None
            })
        else:
            # Page fault occurs
            page_faults += 1
            replaced_page = None

            if len(frames) < num_frames:
                # Memory has space, just add the page
                frames.append(page)
                queue.append(page)
            else:
                # Memory is full, replace the oldest page (FIFO)
                replaced_page = queue.pop(0)
                frames[frames.index(replaced_page)] = page
                queue.append(page)

            steps.append({
                'step': step_num,
                'requested_page': page,
                'frames': frames.copy(),
                'result': 'FAULT',
                'replaced_page': replaced_page
            })

    total_references = len(reference_string)
    hit_ratio = (page_hits / total_references) * 100 if total_references > 0 else 0
    fault_ratio = (page_faults / total_references) * 100 if total_references > 0 else 0

    return {
        'algorithm': 'FIFO',
        'frames': num_frames,
        'total_references': total_references,
        'page_faults': page_faults,
        'page_hits': page_hits,
        'hit_ratio': round(hit_ratio, 2),
        'fault_ratio': round(fault_ratio, 2),
        'steps': steps
    }
