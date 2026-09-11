/* ============================================================
   SmartRAM Simulator — Frontend JavaScript
   ============================================================ */

// State
let currentSimulation = null;
let currentStep = 0;
let autoPlayInterval = null;
let selectedAlgorithm = 'FIFO';
let comparisonResults = null;

// Charts
let hitFaultChart = null;
let faultTimeChart = null;
let compChart = null;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadScenarios();
    initTooltips();
});

function initTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(el => new bootstrap.Tooltip(el));
}

function initializeEventListeners() {
    // Algorithm buttons
    document.querySelectorAll('.algo-btn').forEach(btn => {
        btn.addEventListener('click', () => selectAlgorithm(btn));
    });

    // Run simulation
    document.getElementById('btnRun').addEventListener('click', runSimulation);
    document.getElementById('btnReset').addEventListener('click', resetSimulation);

    // Playback controls
    document.getElementById('btnPrev').addEventListener('click', () => navigateStep(-1));
    document.getElementById('btnNext').addEventListener('click', () => navigateStep(1));
    document.getElementById('btnAutoPlay').addEventListener('click', toggleAutoPlay);

    // Scenario selector
    document.getElementById('scenarioSelect').addEventListener('change', loadScenario);

    // Multi-process
    document.getElementById('btnToggleMultiProc').addEventListener('click', toggleMultiProcess);
}

function selectAlgorithm(btn) {
    document.querySelectorAll('.algo-btn').forEach(b => b.classList.remove('algo-btn-active'));
    btn.classList.add('algo-btn-active');
    selectedAlgorithm = btn.dataset.algo;
}

// ==================== LOAD SCENARIOS ====================
async function loadScenarios() {
    try {
        const response = await fetch('/api/scenarios');
        const scenarios = await response.json();

        const select = document.getElementById('scenarioSelect');
        scenarios.forEach(scenario => {
            const option = document.createElement('option');
            option.value = scenario.id;
            option.textContent = scenario.name;
            option.dataset.refString = scenario.reference_string;
            option.dataset.frames = scenario.frames;
            option.dataset.desc = scenario.description;
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Failed to load scenarios:', err);
    }
}

function loadScenario(e) {
    const option = e.target.selectedOptions[0];
    if (!option.value) {
        document.getElementById('scenarioDesc').textContent = '';
        return;
    }

    document.getElementById('refString').value = option.dataset.refString;
    document.getElementById('numFrames').value = option.dataset.frames;
    document.getElementById('frameDisplay').textContent = option.dataset.frames;
    document.getElementById('scenarioDesc').textContent = option.dataset.desc;
}

// ==================== RUN SIMULATION ====================
async function runSimulation() {
    // Clear errors
    hideError();
    document.getElementById('refStringError').textContent = '';

    // Get values
    const refString = document.getElementById('refString').value.trim();
    const numFrames = parseInt(document.getElementById('numFrames').value);

    // Validate
    if (!refString) {
        document.getElementById('refStringError').textContent = 'Reference string is required';
        return;
    }

    // Prepare request
    const payload = {
        algorithm: selectedAlgorithm,
        frames: numFrames,
        reference_string: refString
    };

    // Disable button
    const btnRun = document.getElementById('btnRun');
    btnRun.disabled = true;
    btnRun.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Running...';

    try {
        const response = await fetch('/api/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            showError(result.error || 'Simulation failed');
            return;
        }

        // Handle comparison vs single
        if (result.comparison) {
            displayComparisonResults(result);
        } else {
            displaySimulationResults(result);
        }

    } catch (err) {
        showError('Network error: ' + err.message);
    } finally {
        btnRun.disabled = false;
        btnRun.innerHTML = '<i class="fas fa-play me-2"></i>Run Simulation';
    }
}

// ==================== DISPLAY RESULTS ====================
function displaySimulationResults(result) {
    currentSimulation = result;
    currentStep = 0;
    comparisonResults = null;

    // Show content, hide empty state
    document.getElementById('emptyState').classList.add('d-none');
    document.getElementById('simContent').classList.remove('d-none');
    document.getElementById('comparisonSection').classList.add('d-none');
    document.getElementById('chartsSection').classList.remove('d-none');

    // Render stats
    renderStats(result);

    // Render algorithm label
    document.getElementById('algoLabel').textContent = result.algorithm;

    // Render trace table header
    renderTraceHeader(result.frames);

    // Render trace body
    renderTraceBody(result.steps);

    // Render algorithm info
    renderAlgorithmInfo(result.algorithm);

    // Render charts
    renderHitFaultChart(result);
    renderFaultTimeChart(result);

    // Enable playback controls
    enablePlaybackControls();

    // Show first step
    showStep(0);
}

function displayComparisonResults(result) {
    currentSimulation = null;
    currentStep = 0;
    comparisonResults = result;

    document.getElementById('emptyState').classList.add('d-none');
    document.getElementById('simContent').classList.remove('d-none');
    document.getElementById('comparisonSection').classList.remove('d-none');
    document.getElementById('chartsSection').classList.add('d-none');

    // Hide RAM visualization and step controls
    document.getElementById('algoLabel').textContent = 'COMPARISON';
    document.getElementById('btnPrev').disabled = true;
    document.getElementById('btnNext').disabled = true;
    document.getElementById('btnAutoPlay').disabled = true;

    // Render comparison stats (use first result)
    const first = result.results[0];
    renderStats({
        total_references: first.total_references,
        page_hits: '—',
        page_faults: '—',
        hit_ratio: '—',
        fault_ratio: '—'
    });

    // Render comparison table
    renderComparisonTable(result);

    // Render comparison chart
    renderComparisonChart(result);

    // Hide RAM and trace
    document.getElementById('ramVisualization').innerHTML = '<p class="text-center text-light-muted small mt-3">Select individual algorithm to see step-by-step trace</p>';
    document.getElementById('traceHead').innerHTML = '';
    document.getElementById('traceBody').innerHTML = '';
    document.getElementById('stepCounter').textContent = '—';
    document.getElementById('currentStepBadge').textContent = '';

    // Hide algo info
    document.getElementById('algoInfoRow').innerHTML = '';
}

function renderStats(result) {
    const stats = [
        { icon: 'fa-hashtag', label: 'Total References', value: result.total_references, color: 'info' },
        { icon: 'fa-circle-check', label: 'Page Hits', value: result.page_hits, color: 'success' },
        { icon: 'fa-circle-xmark', label: 'Page Faults', value: result.page_faults, color: 'danger' },
        { icon: 'fa-percentage', label: 'Hit Ratio', value: result.hit_ratio === '—' ? '—' : result.hit_ratio + '%', color: 'purple' },
        { icon: 'fa-chart-line', label: 'Fault Ratio', value: result.fault_ratio === '—' ? '—' : result.fault_ratio + '%', color: 'warning' }
    ];

    const colorMap = {
        info: 'rgba(88,166,255,.15)',
        success: 'rgba(87,242,135,.15)',
        danger: 'rgba(237,66,69,.15)',
        purple: 'rgba(188,140,255,.15)',
        warning: 'rgba(254,231,92,.15)'
    };

    const textColorMap = {
        info: '#58a6ff',
        success: '#57f287',
        danger: '#ed4245',
        purple: '#bc8cff',
        warning: '#fee75c'
    };

    const html = stats.map(stat => `
        <div class="col-lg col-md-4 col-6">
            <div class="stat-card">
                <div class="stat-icon" style="background:${colorMap[stat.color]};color:${textColorMap[stat.color]};">
                    <i class="fas ${stat.icon}"></i>
                </div>
                <div>
                    <div class="stat-value">${stat.value}</div>
                    <div class="stat-label">${stat.label}</div>
                </div>
            </div>
        </div>
    `).join('');

    document.getElementById('statsRow').innerHTML = html;
}

function renderTraceHeader(numFrames) {
    let html = '<tr><th>Step</th><th>Page</th>';
    for (let i = 1; i <= numFrames; i++) {
        html += `<th>Frame ${i}</th>`;
    }
    html += '<th>Result</th></tr>';
    document.getElementById('traceHead').innerHTML = html;
}

function renderTraceBody(steps) {
    const html = steps.map((step, idx) => {
        const rowClass = step.result === 'HIT' ? 'row-hit' : 'row-fault';
        const badge = step.result === 'HIT'
            ? '<span class="badge badge-hit-sm">HIT</span>'
            : '<span class="badge badge-fault-sm">FAULT</span>';

        let frameCells = '';
        for (let i = 0; i < step.frames.length; i++) {
            const val = step.frames[i] !== null ? step.frames[i] : '—';
            frameCells += `<td>${val}</td>`;
        }

        // Add extra empty cells if needed
        const maxFrames = parseInt(document.getElementById('numFrames').value);
        for (let i = step.frames.length; i < maxFrames; i++) {
            frameCells += '<td>—</td>';
        }

        return `<tr class="${rowClass}" data-step="${idx}">
            <td>${step.step}</td>
            <td class="fw-bold">${step.requested_page}</td>
            ${frameCells}
            <td>${badge}</td>
        </tr>`;
    }).join('');

    document.getElementById('traceBody').innerHTML = html;
}

function renderAlgorithmInfo(algorithm) {
    const info = {
        'FIFO': {
            idea: 'Replace the page that has been in memory the longest (first in, first out).',
            advantage: 'Simple to implement using a queue. Low overhead.',
            disadvantage: 'Can suffer from Bélády\'s Anomaly where increasing frames increases page faults.',
            complexity: 'Time: O(1) per reference, Space: O(n)'
        },
        'LRU': {
            idea: 'Replace the page that has not been accessed for the longest period.',
            advantage: 'Exploits temporal locality. Usually performs better than FIFO for real workloads.',
            disadvantage: 'Requires tracking page usage order, which adds overhead.',
            complexity: 'Time: O(n) per reference, Space: O(n)'
        },
        'OPTIMAL': {
            idea: 'Replace the page whose next use is farthest in the future.',
            advantage: 'Provably optimal — guarantees the minimum number of page faults possible.',
            disadvantage: 'Requires future knowledge. Not implementable in real systems.',
            complexity: 'Time: O(n·f) per reference, Space: O(n)'
        }
    };

    const data = info[algorithm];
    if (!data) {
        document.getElementById('algoInfoRow').innerHTML = '';
        return;
    }

    const html = `
        <div class="col-12">
            <div class="algo-info-card">
                <h6><i class="fas fa-info-circle me-2 text-accent"></i>${algorithm} Algorithm Details</h6>
                <p><strong>Idea:</strong> ${data.idea}</p>
                <p><strong>Advantage:</strong> ${data.advantage}</p>
                <p><strong>Disadvantage:</strong> ${data.disadvantage}</p>
                <p class="mb-0"><strong>Complexity:</strong> ${data.complexity}</p>
            </div>
        </div>
    `;

    document.getElementById('algoInfoRow').innerHTML = html;
}

// ==================== STEP NAVIGATION ====================
function enablePlaybackControls() {
    document.getElementById('btnPrev').disabled = false;
    document.getElementById('btnNext').disabled = false;
    document.getElementById('btnAutoPlay').disabled = false;
}

function showStep(stepIndex) {
    if (!currentSimulation) return;

    const steps = currentSimulation.steps;
    if (stepIndex < 0 || stepIndex >= steps.length) return;

    currentStep = stepIndex;
    const step = steps[stepIndex];

    // Update step counter
    document.getElementById('stepCounter').textContent = `Step ${stepIndex + 1} / ${steps.length}`;
    document.getElementById('currentStepBadge').textContent = `Step ${stepIndex + 1} / ${steps.length}`;

    // Render RAM visualization
    renderRAM(step, currentSimulation.frames);

    // Highlight row in table
    document.querySelectorAll('#traceBody tr').forEach((tr, idx) => {
        tr.classList.toggle('row-active', idx === stepIndex);
    });

    // Scroll to row
    const activeRow = document.querySelector('#traceBody tr.row-active');
    if (activeRow) {
        activeRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Update button states
    document.getElementById('btnPrev').disabled = stepIndex === 0;
    document.getElementById('btnNext').disabled = stepIndex === steps.length - 1;
}

function renderRAM(step, numFrames) {
    let html = '';

    for (let i = 0; i < numFrames; i++) {
        const page = step.frames[i];
        const isEmpty = page === null || page === undefined;

        let frameClass = 'ram-frame';
        let badgeHtml = '';

        if (!isEmpty && step.requested_page === page) {
            if (step.result === 'HIT') {
                frameClass += ' frame-hit frame-animate';
                badgeHtml = '<span class="ram-frame-badge badge-hit">HIT</span>';
            } else if (step.replaced_page === page) {
                frameClass += ' frame-replace frame-animate';
                badgeHtml = '<span class="ram-frame-badge badge-replace">NEW</span>';
            } else {
                frameClass += ' frame-current';
            }
        } else if (step.replaced_page === page) {
            frameClass += ' frame-replace frame-animate';
            badgeHtml = '<span class="ram-frame-badge badge-replace">REPLACED</span>';
        }

        html += `
            <div class="${frameClass}">
                <div class="ram-frame-label">Frame ${i + 1}</div>
                <div class="ram-frame-value">${isEmpty ? '—' : 'Page ' + page}</div>
                ${badgeHtml}
            </div>
        `;
    }

    document.getElementById('ramVisualization').innerHTML = html;
}

function navigateStep(delta) {
    showStep(currentStep + delta);
}

function toggleAutoPlay() {
    const btn = document.getElementById('btnAutoPlay');

    if (autoPlayInterval) {
        // Stop
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
        btn.innerHTML = '<i class="fas fa-circle-play me-1"></i>Play';
        btn.classList.remove('btn-info');
        btn.classList.add('btn-outline-info');
    } else {
        // Start
        const speed = parseInt(document.getElementById('playSpeed').value);
        autoPlayInterval = setInterval(() => {
            if (currentStep < currentSimulation.steps.length - 1) {
                navigateStep(1);
            } else {
                toggleAutoPlay(); // Stop when done
            }
        }, 2200 - speed); // Invert so higher value = faster

        btn.innerHTML = '<i class="fas fa-circle-pause me-1"></i>Pause';
        btn.classList.remove('btn-outline-info');
        btn.classList.add('btn-info');
    }
}

// ==================== COMPARISON ====================
function renderComparisonTable(result) {
    const html = result.results.map(res => {
        const isBest = res.algorithm === result.best_algorithm;
        const rowClass = isBest ? 'best-row' : '';

        return `<tr class="${rowClass}">
            <td><strong>${res.algorithm}</strong>${isBest ? ' <i class="fas fa-trophy text-warning ms-1"></i>' : ''}</td>
            <td>${res.page_faults}</td>
            <td>${res.page_hits}</td>
            <td>${res.hit_ratio}%</td>
            <td>${res.fault_ratio}%</td>
        </tr>`;
    }).join('');

    document.getElementById('compTable').innerHTML = html;

    // Best algo note
    const best = result.results.find(r => r.algorithm === result.best_algorithm);
    document.getElementById('bestAlgoNote').innerHTML = `
        <i class="fas fa-check-circle me-2"></i>
        <strong>${best.algorithm}</strong> performed best with only <strong>${best.page_faults} page faults</strong> for this reference string.
    `;
}

function renderComparisonChart(result) {
    const ctx = document.getElementById('compChart').getContext('2d');

    // Destroy existing
    if (compChart) compChart.destroy();

    const labels = result.results.map(r => r.algorithm);
    const faults = result.results.map(r => r.page_faults);
    const hits = result.results.map(r => r.page_hits);

    compChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Page Faults',
                    data: faults,
                    backgroundColor: 'rgba(237,66,69,.6)',
                    borderColor: '#ed4245',
                    borderWidth: 1
                },
                {
                    label: 'Page Hits',
                    data: hits,
                    backgroundColor: 'rgba(87,242,135,.6)',
                    borderColor: '#57f287',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#c9d1d9' } }
            },
            scales: {
                x: { ticks: { color: '#8b949e' }, grid: { color: '#21262d' } },
                y: { ticks: { color: '#8b949e' }, grid: { color: '#21262d' } }
            }
        }
    });
}

// ==================== CHARTS ====================
function renderHitFaultChart(result) {
    const ctx = document.getElementById('hitFaultChart').getContext('2d');
    if (hitFaultChart) hitFaultChart.destroy();

    hitFaultChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Hits', 'Faults'],
            datasets: [{
                data: [result.page_hits, result.page_faults],
                backgroundColor: ['rgba(87,242,135,.6)', 'rgba(237,66,69,.6)'],
                borderColor: ['#57f287', '#ed4245'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#c9d1d9' } }
            }
        }
    });
}

function renderFaultTimeChart(result) {
    const ctx = document.getElementById('faultTimeChart').getContext('2d');
    if (faultTimeChart) faultTimeChart.destroy();

    // Compute cumulative faults
    let cumulative = 0;
    const data = result.steps.map(step => {
        if (step.result === 'FAULT') cumulative++;
        return cumulative;
    });

    faultTimeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: result.steps.map(s => s.step),
            datasets: [{
                label: 'Cumulative Faults',
                data: data,
                borderColor: '#ed4245',
                backgroundColor: 'rgba(237,66,69,.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#c9d1d9' } }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Step', color: '#8b949e' },
                    ticks: { color: '#8b949e' },
                    grid: { color: '#21262d' }
                },
                y: {
                    title: { display: true, text: 'Page Faults', color: '#8b949e' },
                    ticks: { color: '#8b949e' },
                    grid: { color: '#21262d' }
                }
            }
        }
    });
}

// ==================== RESET ====================
function resetSimulation() {
    currentSimulation = null;
    currentStep = 0;
    comparisonResults = null;

    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
    }

    // Destroy charts
    if (hitFaultChart) { hitFaultChart.destroy(); hitFaultChart = null; }
    if (faultTimeChart) { faultTimeChart.destroy(); faultTimeChart = null; }
    if (compChart) { compChart.destroy(); compChart = null; }

    // Show empty state
    document.getElementById('simContent').classList.add('d-none');
    document.getElementById('emptyState').classList.remove('d-none');

    // Clear form
    document.getElementById('refString').value = '7 0 1 2 0 3 0 4 2 3 0 3 2';
    document.getElementById('numFrames').value = 3;
    document.getElementById('frameDisplay').textContent = 3;
    document.getElementById('scenarioSelect').value = '';
    document.getElementById('scenarioDesc').textContent = '';

    hideError();
    document.getElementById('refStringError').textContent = '';

    // Reset algorithm to FIFO
    document.querySelectorAll('.algo-btn').forEach(b => b.classList.remove('algo-btn-active'));
    document.querySelector('.algo-btn[data-algo="FIFO"]').classList.add('algo-btn-active');
    selectedAlgorithm = 'FIFO';

    // Reset auto-play button
    const btn = document.getElementById('btnAutoPlay');
    btn.innerHTML = '<i class="fas fa-circle-play me-1"></i>Play';
    btn.classList.remove('btn-info');
    btn.classList.add('btn-outline-info');
}

// ==================== ERROR HANDLING ====================
function showError(message) {
    document.getElementById('errorText').textContent = message;
    document.getElementById('errorBanner').classList.remove('d-none');
}

function hideError() {
    document.getElementById('errorBanner').classList.add('d-none');
}

// ==================== MULTI-PROCESS (BONUS) ====================
function toggleMultiProcess() {
    const body = document.getElementById('multiProcBody');
    const btn = document.getElementById('btnToggleMultiProc');
    const icon = btn.querySelector('i');

    if (body.style.display === 'none') {
        body.style.display = 'block';
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
    } else {
        body.style.display = 'none';
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
    }
}

// Initially hide multi-process section
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('multiProcBody').style.display = 'none';
});
