# SmartRAM — Hospital Information System Memory Simulation

An interactive educational Operating Systems project and teaching tool demonstrating how clinical software workloads behave under physical memory constraints using interactive page replacement algorithms.

🔗 **Live Demo:** [https://smartram.vercel.app](https://smartram.vercel.app)  
📦 **GitHub Repository:** [https://github.com/CNH9164/SmartRAM](https://github.com/CNH9164/SmartRAM)

---

## 🌟 Overview

SmartRAM bridges Operating Systems memory management theory with a real-life healthcare IT context. It visualizes how an OS manages limited physical memory frames when four core Hospital Information System (HIS) workflows generate page requests:

1. **Patient Records Management** — High temporal locality as clinical staff examine patient profiles, registration records, and medical histories.
2. **Appointment Management** — Cyclic lookups across daily doctor schedules, booking details, and patient notification queues.
3. **Laboratory Information System** — Batch sample tracking across analyzer interfaces, pending test worklists, and diagnostic report validation.
4. **Pharmacy Management** — High-frequency access to medicine inventory catalogs, prescription verification, and drug interaction checkers.

> **Educational Notice:** Hospital workflows are modeled using synthetic page-reference sequences for academic simulation. No real patient health information (PHI) or hospital databases are used.

---

## 🧠 Core Features

- **3 Page Replacement Algorithms**
  - **FIFO** (First In, First Out) — Replaces the page resident in memory the longest; demonstrates potential Bélády's Anomaly.
  - **LRU** (Least Recently Used) — Replaces the page unreferenced for the longest duration, exploiting temporal locality.
  - **Optimal (Clairvoyant)** — Theoretical benchmark replacing the page unneeded for the longest future duration (minimum possible faults).

- **Hospital Workload Presets & Custom Sequences**
  - Instant selection of the 4 clinical workloads with predefined synthetic sequences and conceptual page mappings.
  - Custom sequence input accepting comma-separated or space-separated page numbers.
  - Configurable memory capacity (1 to 8 frames).

- **Interactive Simulation Dashboard**
  - **Summary Metrics Strip** — Total requests, Page Hits, Page Faults, Replacements, Hit Ratio (%), Fault Ratio (%).
  - **Reference String Progress Track** — Visual clickable token strip showing processed hits/faults, active step, and upcoming requests.
  - **Physical RAM Visualization** — Live frame status with clinical page labels, color-coded Hit (green), Fault (red), and Replaced victim (amber) badges.
  - **Dynamic Plain-Language Explanations** — Step-by-step narration explaining exactly why a hit occurred or why an algorithm chose a specific victim page.
  - **Step-by-Step Trace Table** — Complete history table showing frame state and evicted pages at every step.
  - **Playback Controls** — First step, Previous step, Play/Pause with speed slider, Next step, Last step, and Reset.

- **Algorithm Comparison Mode**
  - Simultaneous evaluation of FIFO, LRU, and Optimal on the identical reference sequence and frame count.
  - Best-performing algorithm detection with trophy badge.
  - Chart.js comparison bar charts and doughnut distributions.
  - Academic context note on workload sensitivity and theoretical benchmark limits.

---

## 🏛️ Project Architecture

```
SmartRAM/
├── app.py                     # Flask application entry point
├── requirements.txt           # Dependencies (Flask, Flask-CORS)
├── vercel.json                # Vercel deployment configuration
│
├── algorithms/                # Pure algorithm implementations
│   ├── __init__.py
│   ├── fifo.py               # First-In First-Out
│   ├── lru.py                # Least Recently Used
│   └── optimal.py            # Optimal (Clairvoyant)
│
├── routes/                    # Flask route blueprints
│   ├── __init__.py
│   ├── main.py               # Home (index.html) and simulator page routes
│   └── simulation.py         # REST API endpoints (/api/simulate, /api/scenarios)
│
├── services/                  # Business logic & validation
│   ├── __init__.py
│   └── simulator.py          # Input validation and algorithm orchestration
│
├── templates/                 # Jinja2 HTML templates
│   ├── index.html            # Landing / educational overview page
│   └── simulator.html        # Interactive hospital simulation dashboard
│
└── static/                    # Frontend assets
    ├── css/
    │   └── style.css         # Modern clinical OS theme stylesheet
    └── js/
        └── simulator.js      # Frontend visualization engine & Chart.js integration
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- pip

### Installation & Execution

1. **Clone the repository:**
   ```bash
   git clone https://github.com/CNH9164/SmartRAM.git
   cd SmartRAM
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the Flask application:**
   ```bash
   python app.py
   ```

4. **Access the application:**
   Open [http://127.0.0.1:5000](http://127.0.0.1:5000) or [http://127.0.0.1:5000/simulator](http://127.0.0.1:5000/simulator) in your web browser.

---

## 📡 REST API Documentation

### 1. Run Simulation
- **Endpoint:** `POST /api/simulate`
- **Request Body (Single Algorithm):**
  ```json
  {
    "algorithm": "LRU",
    "frames": 3,
    "reference_string": "1, 2, 3, 1, 4, 2, 1, 5, 2, 1"
  }
  ```
- **Response:**
  ```json
  {
    "algorithm": "LRU",
    "frames": 3,
    "total_references": 10,
    "page_faults": 6,
    "page_hits": 4,
    "page_replacements": 3,
    "hit_ratio": 40.0,
    "fault_ratio": 60.0,
    "steps": [
      {
        "step": 1,
        "requested_page": 1,
        "frames": [1],
        "result": "FAULT",
        "replaced_page": null
      }
    ]
  }
  ```

- **Request Body (Compare All):**
  ```json
  {
    "algorithm": "ALL",
    "frames": 3,
    "reference_string": "1, 2, 3, 1, 4, 2, 1, 5, 2, 1"
  }
  ```
- **Response:**
  ```json
  {
    "comparison": true,
    "best_algorithm": "OPTIMAL",
    "best_page_faults": 5,
    "results": [
      { "algorithm": "FIFO", "page_faults": 7, "page_hits": 3, "page_replacements": 4, "hit_ratio": 30.0, "fault_ratio": 70.0, ... },
      { "algorithm": "LRU", "page_faults": 6, "page_hits": 4, "page_replacements": 3, "hit_ratio": 40.0, "fault_ratio": 60.0, ... },
      { "algorithm": "OPTIMAL", "page_faults": 5, "page_hits": 5, "page_replacements": 2, "hit_ratio": 50.0, "fault_ratio": 50.0, ... }
    ]
  }
  ```

### 2. Get Hospital Workload Scenarios
- **Endpoint:** `GET /api/scenarios`
- **Response:** Array of 4 predefined hospital workload scenarios with descriptions and conceptual page mappings.

---

## 📄 License

MIT License — free for academic and educational use.
