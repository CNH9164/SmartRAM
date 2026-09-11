"""
Optimal Page Replacement Algorithm
Replaces the page whose next use is farthest in the future
This is a theoretical optimal algorithm used for comparison
"""

def simulate(reference_string, num_frames):
    """
    Simulate Optimal page replacement algorithm

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

    for step_num, page in enumerate(reference_string):
        current_index = step_num

        # Check if page is already in memory (HIT)
        if page in frames:
            page_hits += 1
            steps.append({
                'step': step_num + 1,
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
            else:
                # Memory is full, find the page that will be used farthest in the future
                future_uses = []

                for frame_page in frames:
                    # Find when this page will be used next
                    try:
                        next_use = reference_string[current_index + 1:].index(frame_page)
                    except ValueError:
                        # Page will never be used again, highest priority for replacement
                        next_use = float('inf')

                    future_uses.append((frame_page, next_use))

                # Find the page with the farthest next use
                page_to_replace = max(future_uses, key=lambda x: x[1])[0]
                replaced_page = page_to_replace
                frames[frames.index(page_to_replace)] = page

            steps.append({
                'step': step_num + 1,
                'requested_page': page,
                'frames': frames.copy(),
                'result': 'FAULT',
                'replaced_page': replaced_page
            })

    total_references = len(reference_string)
    hit_ratio = (page_hits / total_references) * 100 if total_references > 0 else 0
    fault_ratio = (page_faults / total_references) * 100 if total_references > 0 else 0

    return {
        'algorithm': 'OPTIMAL',
        'frames': num_frames,
        'total_references': total_references,
        'page_faults': page_faults,
        'page_hits': page_hits,
        'hit_ratio': round(hit_ratio, 2),
        'fault_ratio': round(fault_ratio, 2),
        'steps': steps
    }
