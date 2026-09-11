# SmartRAM — Interactive Virtual Memory & Page Replacement Simulator

A modern full-stack web application designed for Operating Systems courses, demonstrating how an OS manages limited physical RAM when multiple applications request memory pages.

![SmartRAM Dashboard Preview](https://via.placeholder.com/1200x600/0d1117/58a6ff?text=SmartRAM+Interactive+Simulator)

---

## 🌟 Features

- **3 Core Page Replacement Algorithms**
  - **FIFO** (First In First Out) — Simple queue-based replacement
  - **LRU** (Least Recently Used) — Usage-order tracking for temporal locality
  - **Optimal (Clairvoyant)** — Theoretical optimal algorithm with future knowledge

- **Algorithm Comparison Mode**
  - Run all 3 algorithms simultaneously on the same reference string
  - Side-by-side performance metrics (Page Faults, Hits, Hit/Fault Ratios)
  - Interactive comparison bar charts
  - Automatic best-algorithm detection

- **Step-by-Step Interactive Playback**
  - Previous / Next navigation
  - Auto-play mode with adjustable speed
  - Visual RAM slot updates (Page In, Hit, Eviction/Replacement)
  - Full trace table highlighting current step

- **Real-World Scenarios**
  - **Web Browser** — Multi-tab switching with temporal locality
  - **Video Streaming** — Sequential playback with seeking
  - **Database Queries** — Hot index pages vs cold scan pages
  - **Bélády's Anomaly Demo** — Demonstrating the FIFO frame anomaly

- **Modern Responsive UI**
  - Dark mode OS/Hardware aesthetic
  - Glassmorphism navigation
  - Chart.js visualizations (Doughnut ratios, cumulative fault line graphs)
  - Tooltips, badges, and smooth animations

---

## 🏛️ Project Architecture

```
SmartRAM/
│
├── app.py                     # Flask application entry point
├── requirements.txt           # Python dependencies
│
├── algorithms/                # Pure algorithm implementations
│   ├── __init__.py
│   ├── fifo.py               # First-In First-Out
│   ├── lru.py                # Least Recently Used
│   └── optimal.py            # Optimal (Clairvoyant)
│
├── routes/                    # Flask route blueprints
│   ├── __init__.py
│   ├── main.py               # Home and simulator page routes
│   └── simulation.py         # REST API endpoints
│
├── services/                  # Business logic & validation
│   ├── __init__.py
│   └── simulator.py          # Orchestrates algorithm runs
│
├── templates/                 # Jinja2 HTML templates
│   ├── index.html            # Landing / educational page
│   └── simulator.html        # Interactive simulation dashboard
│
└── static/                    # Frontend assets
    ├── css/
    │   └── style.css         # Modern dark dashboard stylesheet
    └── js/
        └── simulator.js      # Interactive playback, API & charts
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- pip

### Installation

1. **Clone the repository:**
   ```bash
   cd D:\OS-PROJECT
   ```

2. **Create a virtual environment (optional but recommended):**
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application:**
   ```bash
   python app.py
   ```

5. **Open in browser:**
   Navigate to [http://127.0.0.1:5000](http://127.0.0.1:5000)

---

## 📡 REST API Documentation

### Run Simulation

**Endpoint:** `POST /api/simulate`

**Request Body:**
```json
{
  "algorithm": "LRU",
  "frames": 3,
  "reference_string": "7 0 1 2 0 3 0 4 2 3 0 3 2"
}
```

*Note: `reference_string` can be a space-separated string or an array of integers.*

**Response (Single Algorithm):**
```json
{
  "algorithm": "LRU",
  "frames": 3,
  "total_references": 13,
  "page_faults": 8,
  "page_hits": 5,
  "hit_ratio": 38.46,
  "fault_ratio": 61.54,
  "steps": [
    {
      "step": 1,
      "requested_page": 7,
      "frames": [7],
      "result": "FAULT",
      "replaced_page": null
    },
    ...
  ]
}
```

**Response (Compare All — `algorithm: "ALL"`):**
```json
{
  "comparison": true,
  "best_algorithm": "OPTIMAL",
  "best_page_faults": 6,
  "results": [
    { "algorithm": "FIFO", "page_faults": 9, ... },
    { "algorithm": "LRU", "page_faults": 8, ... },
    { "algorithm": "OPTIMAL", "page_faults": 6, ... }
  ]
}
```

---

## 🧠 Educational Concepts Explained

### 1. Bélády's Anomaly
Normally, giving an algorithm more frames decreases the number of page faults. However, FIFO can suffer from **Bélády's Anomaly**, where increasing the frame allocation actually *increases* the page fault count! You can test this using the built-in scenario in the simulator.

### 2. Temporal Locality
Programs tend to access the same memory locations repeatedly within short periods. **LRU** exploits this by assuming recently accessed pages will likely be accessed again soon.

### 3. Clairvoyant (Optimal) Algorithm
The optimal page replacement algorithm requires future knowledge of all memory accesses. While impossible in real operating systems, it serves as the theoretical benchmark against which all practical algorithms are measured.

---

## 🎓 Academic Viva/Presentation Notes

- **Separation of Concerns:** Algorithms are completely decoupled from the web framework in `algorithms/` and can be tested standalone.
- **Dynamic API:** No hardcoded simulation results — everything is computed dynamically in Python.
- **Extensibility:** New algorithms (e.g., LFU, Clock, Second Chance) can be added simply by creating a new module in `algorithms/` and registering it in `services/simulator.py`.

---

## 📄 License

MIT License — free for educational and academic use.
