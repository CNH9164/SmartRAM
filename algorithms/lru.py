"""
LRU (Least Recently Used) Page Replacement Algorithm
Replaces the page that has not been accessed for the longest time
"""

def simulate(reference_string, num_frames):
    """
    Simulate LRU page replacement algorithm

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
    recent_use = []  # Track order of recent usage

    for step_num, page in enumerate(reference_string, 1):
        # Check if page is already in memory (HIT)
        if page in frames:
            page_hits += 1
            # Update recent usage - move to end (most recently used)
            recent_use.remove(page)
            recent_use.append(page)

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
                recent_use.append(page)
            else:
                # Memory is full, replace the least recently used page
                lru_page = recent_use.pop(0)
                replaced_page = lru_page
                frames[frames.index(lru_page)] = page
                recent_use.append(page)

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
        'algorithm': 'LRU',
        'frames': num_frames,
        'total_references': total_references,
        'page_faults': page_faults,
        'page_hits': page_hits,
        'hit_ratio': round(hit_ratio, 2),
        'fault_ratio': round(fault_ratio, 2),
        'steps': steps
    }
