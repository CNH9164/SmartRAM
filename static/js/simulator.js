/* ============================================================
   SmartRAM — Hospital Information System Memory Simulation
   Interactive Frontend Controller & Visualization Engine
   ============================================================ */

// Application State
let hospitalScenarios = [];
let activeScenario = null;
let currentWorkloadMode = 'scenarios'; // 'scenarios' | 'custom'
let selectedAlgorithm = 'FIFO'; // 'FIFO' | 'LRU' | 'OPTIMAL' | 'ALL'

let currentSimulation = null;
let currentStep = 0;
let autoPlayInterval = null;
let comparisonResults = null;

// Chart.js Instances
let hitFaultDoughnutChart = null;
let cumulativeFaultLineChart = null;
let compBarChart = null;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadHospitalScenarios();
    initBootstrapTooltips();
});

function initBootstrapTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(el => new bootstrap.Tooltip(el));
}

function initializeEventListeners() {
    // Keyboard shortcuts for step navigation
    document.addEventListener('keydown', (e) => {
        if (!currentSimulation || currentSimulation.comparison) return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.key === 'ArrowRight' || e.key === 'n' || e.key === 'N') {
            navigateStep(1);
        } else if (e.key === 'ArrowLeft' || e.key === 'p' || e.key === 'P') {
            navigateStep(-1);
        } else if (e.key === ' ') {
            e.preventDefault();
            toggleAutoPlay();
        }
    });
}

// ==================== LOAD HOSPITAL SCENARIOS ====================
async function loadHospitalScenarios() {
    const container = document.getElementById('scenarioCardsList');
    try {
        const response = await fetch('/api/scenarios');
        if (!response.ok) throw new Error('Failed to load scenarios');

        hospitalScenarios = await response.json();
        renderScenarioCards(hospitalScenarios);

        // Select first scenario by default
        if (hospitalScenarios.length > 0) {
            selectScenario(hospitalScenarios[0].id);
        }
    } catch (err) {
        console.error('Error fetching scenarios:', err);
        container.innerHTML = `
            <div class="alert alert-danger py-2 small mb-2">
                <i class="fas fa-triangle-exclamation me-1"></i> Failed to load hospital workloads.
            </div>
        `;
    }
}

function renderScenarioCards(scenarios) {
    const container = document.getElementById('scenarioCardsList');
    let html = '';

    scenarios.forEach((sc, index) => {
        html += `
            <div class="scenario-card-item ${index === 0 ? 'selected' : ''}"
                 id="scenario-card-${sc.id}"
                 onclick="selectScenario('${sc.id}')">
                <div class="scenario-card-title">
                    <span><i class="fas ${sc.icon || 'fa-hospital'} text-teal me-2"></i>${sc.name}</span>
                    <span class="badge bg-teal-soft text-teal" style="font-size:0.6rem;">${sc.badge || 'Workflow'}</span>
                </div>
                <div class="scenario-card-desc">${sc.description}</div>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="scenario-card-seq">${sc.reference_string}</span>
                    <span class="text-dim" style="font-size:0.68rem;">${sc.frames} Frames</span>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function selectScenario(scenarioId) {
    const scenario = hospitalScenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    activeScenario = scenario;

    // Update Card UI
    document.querySelectorAll('.scenario-card-item').forEach(card => {
        card.classList.remove('selected');
    });
    const activeCard = document.getElementById(`scenario-card-${scenarioId}`);
    if (activeCard) activeCard.classList.add('selected');

    // Update Active Badge
    const badge = document.getElementById('activeScenarioBadge');
    if (badge) badge.textContent = scenario.name.split(' ')[0];

    // Populate sequence & frames
    document.getElementById('refString').value = scenario.reference_string;
    document.getElementById('numFrames').value = scenario.frames;
    updateFrameDisplay(scenario.frames);

    // Update Scenario Page Mapping Tags
    renderScenarioMappings(scenario.page_mappings);

    // Update timeline label
    const timelineLabel = document.getElementById('timelineScenarioLabel');
    if (timelineLabel) timelineLabel.textContent = scenario.name;
}

function renderScenarioMappings(mappings) {
    const container = document.getElementById('scenarioMappingTags');
    if (!mappings || Object.keys(mappings).length === 0) {
        container.innerHTML = '<span class="text-dim">Standard page identifiers.</span>';
        return;
    }

    let html = '';
    for (const [pageId, name] of Object.entries(mappings)) {
        html += `
            <span class="mapping-tag" title="Page ${pageId} represents ${name}">
                <span class="page-num">P${pageId}:</span> ${name}
            </span>
        `;
    }
    container.innerHTML = html;
}

// ==================== WORKLOAD MODE SWITCHING ====================
function switchWorkloadMode(mode) {
    currentWorkloadMode = mode;

    const tabScenarios = document.getElementById('tabScenarios');
    const tabCustom = document.getElementById('tabCustom');
    const secScenarios = document.getElementById('sectionHospitalScenarios');
    const secCustom = document.getElementById('sectionCustomSequence');

    if (mode === 'scenarios') {
        tabScenarios.classList.add('active');
        tabCustom.classList.remove('active');
        secScenarios.classList.remove('d-none');
        secCustom.classList.add('d-none');

        if (activeScenario) {
            document.getElementById('refString').value = activeScenario.reference_string;
            document.getElementById('timelineScenarioLabel').textContent = activeScenario.name;
        }
    } else {
        tabCustom.classList.add('active');
        tabScenarios.classList.remove('active');
        secCustom.classList.remove('d-none');
        secScenarios.classList.add('d-none');

        document.getElementById('timelineScenarioLabel').textContent = 'Custom Sequence';
    }
}

function loadQuickSequence(seq) {
    document.getElementById('refString').value = seq;
    hideError();
}

function updateFrameDisplay(val) {
    document.getElementById('frameDisplay').textContent = val;
}

// ==================== ALGORITHM SELECTION ====================
function selectAlgorithm(algo) {
    selectedAlgorithm = algo;

    // Reset button states
    document.querySelectorAll('.algo-btn').forEach(b => b.classList.remove('algo-btn-active'));
    const compBtn = document.getElementById('btnCompareMode');
    if (compBtn) compBtn.classList.remove('algo-btn-active');

    if (algo === 'ALL') {
        if (compBtn) compBtn.classList.add('algo-btn-active');
    } else {
        const activeBtn = document.querySelector(`.algo-btn[data-algo="${algo}"]`);
        if (activeBtn) activeBtn.classList.add('algo-btn-active');
    }

    // Update Brief Explanation
    const infoMap = {
        'FIFO': {
            name: 'FIFO (First In, First Out)',
            desc: 'Replaces the page that entered physical memory earliest. Uses a simple arrival queue.'
        },
        'LRU': {
            name: 'LRU (Least Recently Used)',
            desc: 'Replaces the page that has not been accessed for the longest time. Exploits temporal locality.'
        },
        'OPTIMAL': {
            name: 'Optimal (Clairvoyant Benchmark)',
            desc: 'Replaces the page whose next use is farthest in the future. Serves as theoretical mathematical ceiling.'
        },
        'ALL': {
            name: 'Comparative Benchmark Evaluation',
            desc: 'Executes FIFO, LRU, and Optimal simultaneously on the identical workload and frame allocation.'
        }
    };

    const info = infoMap[algo] || infoMap['FIFO'];
    document.getElementById('algoNameBrief').textContent = info.name;
    document.getElementById('algoDescBrief').textContent = info.desc;
}

// ==================== RUN SIMULATION ====================
async function runSimulation() {
    hideError();
    document.getElementById('refStringError').textContent = '';

    const refStringInput = document.getElementById('refString').value.trim();
    const numFrames = parseInt(document.getElementById('numFrames').value);

    // Basic frontend validation
    if (!refStringInput) {
        document.getElementById('refStringError').textContent = 'Please enter a page sequence.';
        showError('Page sequence cannot be empty.');
        return;
    }

    const payload = {
        algorithm: selectedAlgorithm,
        frames: numFrames,
        reference_string: refStringInput
    };

    const btnRun = document.getElementById('btnRun');
    const originalBtnHtml = btnRun.innerHTML;
    btnRun.disabled = true;
    btnRun.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Simulating...';

    try {
        const response = await fetch('/api/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            showError(data.error || 'Simulation failed to run.');
            return;
        }

        if (data.comparison) {
            displayComparisonResults(data, numFrames);
        } else {
            displaySingleSimulation(data);
        }

    } catch (err) {
        showError('Network error: ' + err.message);
    } finally {
        btnRun.disabled = false;
        btnRun.innerHTML = originalBtnHtml;
    }
}

// ==================== DISPLAY SINGLE ALGORITHM SIMULATION ====================
function displaySingleSimulation(result) {
    currentSimulation = result;
    currentStep = 0;
    comparisonResults = null;

    // UI state switches
    document.getElementById('emptyState').classList.add('d-none');
    document.getElementById('simContent').classList.remove('d-none');
    document.getElementById('comparisonSection').classList.add('d-none');
    document.getElementById('ramAndTraceRow').classList.remove('d-none');
    document.getElementById('individualChartsSection').classList.remove('d-none');
    document.getElementById('playbackBar').classList.remove('d-none');
    document.getElementById('stepExplanationCard').classList.remove('d-none');

    // Update Algorithm Badge
    document.getElementById('algoLabelBadge').textContent = result.algorithm;

    // Render Stats
    renderStats({
        total_references: result.total_references,
        page_hits: result.page_hits,
        page_faults: result.page_faults,
        page_replacements: result.page_replacements,
        hit_ratio: result.hit_ratio,
        fault_ratio: result.fault_ratio
    });

    // Render Reference String Progress Tokens
    renderReferenceTokens(result.steps);

    // Render Trace Table Header & Body
    renderTraceTableHeader(result.frames);
    renderTraceTableBody(result.steps, result.frames);

    // Render Charts
    renderHitFaultDoughnut(result.page_hits, result.page_faults);
    renderCumulativeFaultLine(result.steps);

    // Display Initial Step (Step 0)
    showStep(0);
}

// ==================== DISPLAY COMPARISON RESULTS ====================
function displayComparisonResults(data, frames) {
    currentSimulation = { comparison: true, results: data.results };
    currentStep = 0;
    comparisonResults = data;

    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
    }

    // UI State
    document.getElementById('emptyState').classList.add('d-none');
    document.getElementById('simContent').classList.remove('d-none');
    document.getElementById('comparisonSection').classList.remove('d-none');
    document.getElementById('ramAndTraceRow').classList.add('d-none');
    document.getElementById('individualChartsSection').classList.add('d-none');
    document.getElementById('playbackBar').classList.add('d-none');
    document.getElementById('stepExplanationCard').classList.add('d-none');

    const first = data.results[0];

    // Render Comparison Stats Overview
    renderStats({
        total_references: first.total_references,
        page_hits: '—',
        page_faults: '—',
        page_replacements: '—',
        hit_ratio: '—',
        fault_ratio: '—'
    });

    // Render Reference String Progress Tokens (Neutral)
    renderReferenceTokens(first.steps, true);

    // Render Comparison Table
    renderComparisonTable(data);

    // Render Comparison Bar Chart
    renderComparisonBarChart(data);
}

// ==================== RENDER STATS CARDS ====================
function renderStats(stats) {
    const items = [
        {
            icon: 'fa-layer-group',
            label: 'Total Requests',
            value: stats.total_references,
            color: 'teal',
            bg: 'var(--teal-soft)',
            fg: 'var(--teal-light)'
        },
        {
            icon: 'fa-circle-check',
            label: 'Page Hits',
            value: stats.page_hits,
            color: 'success',
            bg: 'var(--hit-soft)',
            fg: 'var(--hit-color)'
        },
        {
            icon: 'fa-circle-xmark',
            label: 'Page Faults',
            value: stats.page_faults,
            color: 'danger',
            bg: 'var(--fault-soft)',
            fg: 'var(--fault-color)'
        },
        {
            icon: 'fa-right-left',
            label: 'Replacements',
            value: stats.page_replacements,
            color: 'warning',
            bg: 'var(--replace-soft)',
            fg: 'var(--replace-color)'
        },
        {
            icon: 'fa-chart-pie',
            label: 'Hit Ratio',
            value: stats.hit_ratio === '—' ? '—' : `${stats.hit_ratio}%`,
            color: 'teal',
            bg: 'var(--teal-soft)',
            fg: 'var(--teal-light)'
        },
        {
            icon: 'fa-chart-line',
            label: 'Fault Ratio',
            value: stats.fault_ratio === '—' ? '—' : `${stats.fault_ratio}%`,
            color: 'danger',
            bg: 'var(--fault-soft)',
            fg: 'var(--fault-color)'
        }
    ];

    let html = '';
    items.forEach(item => {
        html += `
            <div class="col-xl-2 col-lg-4 col-md-4 col-6">
                <div class="stat-card">
                    <div class="stat-icon" style="background:${item.bg}; color:${item.fg};">
                        <i class="fas ${item.icon}"></i>
                    </div>
                    <div>
                        <div class="stat-value" style="color:${item.fg};">${item.value}</div>
                        <div class="stat-label">${item.label}</div>
                    </div>
                </div>
            </div>
        `;
    });

    document.getElementById('statsRow').innerHTML = html;
}

// ==================== REFERENCE TOKENS STRIP ====================
function renderReferenceTokens(steps, isComparison = false) {
    const container = document.getElementById('referenceTokensStrip');
    let html = '';

    steps.forEach((step, idx) => {
        const pageName = getPageConceptName(step.requested_page);
        const tooltip = `Step ${step.step}: Page ${step.requested_page}${pageName ? ' (' + pageName + ')' : ''}`;

        html += `
            <div class="ref-token" id="refToken-${idx}"
                 title="${tooltip}"
                 onclick="${isComparison ? '' : 'navigateStepTo(' + idx + ')'}">
                <span class="token-step-num">#${step.step}</span>
                <span>${step.requested_page}</span>
            </div>
        `;
    });

    container.innerHTML = html;
}

function updateReferenceTokensProgress(activeStepIdx, steps) {
    steps.forEach((step, idx) => {
        const tokenEl = document.getElementById(`refToken-${idx}`);
        if (!tokenEl) return;

        tokenEl.className = 'ref-token';

        if (idx === activeStepIdx) {
            tokenEl.classList.add('token-active');
        } else if (idx < activeStepIdx) {
            if (step.result === 'HIT') {
                tokenEl.classList.add('token-hit');
            } else {
                tokenEl.classList.add('token-fault');
            }
        }
    });

    // Auto-scroll token into view
    const activeToken = document.getElementById(`refToken-${activeStepIdx}`);
    if (activeToken) {
        activeToken.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}

// ==================== STEP-BY-STEP TRACE TABLE ====================
function renderTraceTableHeader(numFrames) {
    let html = `
        <tr>
            <th style="width: 50px;">Step</th>
            <th style="width: 70px;">Page</th>
            <th>Hospital Workflow Context</th>
    `;

    for (let i = 1; i <= numFrames; i++) {
        html += `<th class="text-center" style="min-width: 65px;">Frame ${i}</th>`;
    }

    html += `
            <th class="text-center" style="width: 90px;">Result</th>
            <th class="text-center" style="width: 100px;">Evicted Page</th>
        </tr>
    `;

    document.getElementById('traceTableHead').innerHTML = html;
}

function renderTraceTableBody(steps, numFrames) {
    let html = '';

    steps.forEach((step, idx) => {
        const isHit = step.result === 'HIT';
        const rowClass = isHit ? 'row-hit' : 'row-fault';
        const badge = isHit
            ? '<span class="frame-badge badge-hit"><i class="fas fa-circle-check"></i> HIT</span>'
            : '<span class="frame-badge badge-fault"><i class="fas fa-circle-xmark"></i> FAULT</span>';

        const conceptName = getPageConceptName(step.requested_page) || 'Synthetic Page Reference';

        let frameCells = '';
        for (let f = 0; f < numFrames; f++) {
            const val = step.frames[f] !== undefined && step.frames[f] !== null ? step.frames[f] : '—';
            const isResident = val !== '—';
            frameCells += `<td class="text-center font-monospace ${isResident ? 'text-white' : 'text-dim'}">${val}</td>`;
        }

        const evicted = step.replaced_page !== null && step.replaced_page !== undefined
            ? `<span class="frame-badge badge-replace">Page ${step.replaced_page}</span>`
            : '<span class="text-dim">—</span>';

        html += `
            <tr class="${rowClass}" id="traceRow-${idx}" onclick="navigateStepTo(${idx})">
                <td class="font-monospace fw-bold">#${step.step}</td>
                <td class="font-monospace fw-bold text-teal">${step.requested_page}</td>
                <td class="small text-secondary">${conceptName}</td>
                ${frameCells}
                <td class="text-center">${badge}</td>
                <td class="text-center">${evicted}</td>
            </tr>
        `;
    });

    document.getElementById('traceTableBody').innerHTML = html;
}

// ==================== STEP NAVIGATION & RAM DISPLAY ====================
function showStep(stepIndex) {
    if (!currentSimulation || !currentSimulation.steps) return;

    const steps = currentSimulation.steps;
    if (stepIndex < 0 || stepIndex >= steps.length) return;

    currentStep = stepIndex;
    const step = steps[stepIndex];

    // Update Counter Badges
    const counterText = `Step ${stepIndex + 1} of ${steps.length}`;
    document.getElementById('stepCounterBadge').textContent = counterText;
    document.getElementById('currentStepIndicator').textContent = `Step ${stepIndex + 1} / ${steps.length}`;

    // Update Reference String Tokens
    updateReferenceTokensProgress(stepIndex, steps);

    // Render RAM Visualization Frames
    renderRAMFrames(step, currentSimulation.frames);

    // Generate Dynamic Plain-Language Explanation
    renderStepExplanation(step, stepIndex, steps);

    // Highlight row in Trace Table
    document.querySelectorAll('#traceTableBody tr').forEach((tr, idx) => {
        tr.classList.toggle('row-active', idx === stepIndex);
    });

    const activeRow = document.getElementById(`traceRow-${stepIndex}`);
    if (activeRow) {
        activeRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Update Playback Navigation Buttons
    document.getElementById('btnFirst').disabled = stepIndex === 0;
    document.getElementById('btnPrev').disabled = stepIndex === 0;
    document.getElementById('btnNext').disabled = stepIndex === steps.length - 1;
    document.getElementById('btnLast').disabled = stepIndex === steps.length - 1;
}

function renderRAMFrames(step, numFrames) {
    const container = document.getElementById('ramFramesContainer');
    let html = '';

    for (let f = 0; f < numFrames; f++) {
        const page = step.frames[f];
        const isEmpty = page === null || page === undefined;

        let frameClass = 'ram-frame-card';
        let badgeHtml = '<span class="frame-badge badge-empty">Empty</span>';
        let contextLabel = 'Unallocated memory slot';

        if (!isEmpty) {
            const pageName = getPageConceptName(page);
            contextLabel = pageName ? pageName : `Page ${page} in resident set`;

            if (step.requested_page === page) {
                if (step.result === 'HIT') {
                    frameClass += ' frame-hit';
                    badgeHtml = '<span class="frame-badge badge-hit"><i class="fas fa-check"></i> HIT</span>';
                } else if (step.replaced_page !== null) {
                    frameClass += ' frame-replace';
                    badgeHtml = `<span class="frame-badge badge-replace"><i class="fas fa-arrows-rotate"></i> REPLACED</span>`;
                } else {
                    frameClass += ' frame-fault';
                    badgeHtml = '<span class="frame-badge badge-fault"><i class="fas fa-download"></i> LOADED</span>';
                }
            } else if (step.replaced_page === page) {
                frameClass += ' frame-replace';
                badgeHtml = '<span class="frame-badge badge-replace">EVICTED</span>';
            } else {
                frameClass += ' frame-current';
                badgeHtml = '<span class="frame-badge bg-dark-card text-muted border border-dark-2">Resident</span>';
            }
        }

        html += `
            <div class="${frameClass}">
                <div class="ram-frame-meta">
                    <div class="ram-frame-number">Frame ${f + 1}</div>
                    <div class="ram-frame-context text-truncate" style="max-width: 170px;">${contextLabel}</div>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <div class="ram-frame-content ${isEmpty ? 'empty' : ''}">
                        ${isEmpty ? '—' : 'Page ' + page}
                    </div>
                    ${badgeHtml}
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

// ==================== PLAIN-LANGUAGE EXPLANATION GENERATOR ====================
function renderStepExplanation(step, stepIndex, steps) {
    const headerEl = document.getElementById('stepExplanationHeader');
    const bodyEl = document.getElementById('stepExplanationBody');

    const reqPage = step.requested_page;
    const pageContext = getPageConceptName(reqPage);
    const contextPrefix = pageContext ? `Page ${reqPage} (<em>${pageContext}</em>)` : `Page ${reqPage}`;

    headerEl.innerHTML = `Step ${step.step}: Memory Access for ${contextPrefix}`;

    let explanation = '';

    if (step.result === 'HIT') {
        explanation = `
            <strong>PAGE HIT:</strong> ${contextPrefix} is already resident in physical memory.
            The memory management unit (MMU) directly resolves the virtual address to physical RAM with zero disk I/O latency. No page eviction or replacement is required.
        `;
    } else {
        // Page fault
        if (step.replaced_page === null || step.replaced_page === undefined) {
            explanation = `
                <strong>PAGE FAULT (Cold / Demand Load):</strong> ${contextPrefix} was not resident in memory.
                Because available empty frames were present in physical RAM, ${contextPrefix} was allocated an empty frame directly from secondary storage without needing to evict any existing resident page.
            `;
        } else {
            const replacedContext = getPageConceptName(step.replaced_page);
            const replacedLabel = replacedContext ? `Page ${step.replaced_page} (<em>${replacedContext}</em>)` : `Page ${step.replaced_page}`;

            let algoLogic = '';
            if (currentSimulation.algorithm === 'FIFO') {
                algoLogic = `All frames were occupied. Under <strong>FIFO</strong> (First In, First Out), ${replacedLabel} was selected as the victim because it entered physical memory earliest among all resident pages.`;
            } else if (currentSimulation.algorithm === 'LRU') {
                algoLogic = `All frames were occupied. Under <strong>LRU</strong> (Least Recently Used), ${replacedLabel} was selected as the victim because it has remained unreferenced for the longest continuous interval.`;
            } else if (currentSimulation.algorithm === 'OPTIMAL') {
                algoLogic = `All frames were occupied. Under <strong>Optimal</strong> (Clairvoyant), ${replacedLabel} was selected because its next referenced request occurs farthest in the future (or never again).`;
            } else {
                algoLogic = `All frames were occupied. The active algorithm selected ${replacedLabel} as the eviction candidate.`;
            }

            explanation = `
                <strong>PAGE FAULT with REPLACEMENT:</strong> ${contextPrefix} was not present in physical RAM.
                ${algoLogic} ${replacedLabel} was evicted to disk, and ${contextPrefix} was loaded into its frame.
            `;
        }
    }

    bodyEl.innerHTML = explanation;
}

// Helper to look up conceptual hospital page name
function getPageConceptName(pageNumber) {
    if (activeScenario && activeScenario.page_mappings) {
        return activeScenario.page_mappings[String(pageNumber)] || null;
    }
    return null;
}

// ==================== PLAYBACK CONTROLS ====================
function navigateStep(delta) {
    showStep(currentStep + delta);
}

function navigateStepTo(index) {
    showStep(index);
}

function navigateStepToLast() {
    if (currentSimulation && currentSimulation.steps) {
        showStep(currentSimulation.steps.length - 1);
    }
}

function toggleAutoPlay() {
    const playIcon = document.getElementById('playIcon');
    const playText = document.getElementById('playText');
    const autoPlayBtn = document.getElementById('btnAutoPlay');

    if (autoPlayInterval) {
        // Stop
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
        playIcon.className = 'fas fa-play';
        playText.textContent = 'Play';
        autoPlayBtn.classList.remove('btn-danger');
    } else {
        // If at the end, restart from beginning
        if (currentSimulation && currentStep >= currentSimulation.steps.length - 1) {
            showStep(0);
        }

        const speedVal = parseInt(document.getElementById('playSpeed').value);
        // Map 200..2000 to delay (invert: higher slider = faster)
        const delay = 2200 - speedVal;

        playIcon.className = 'fas fa-pause';
        playText.textContent = 'Pause';
        autoPlayBtn.classList.add('btn-danger');

        autoPlayInterval = setInterval(() => {
            if (currentSimulation && currentStep < currentSimulation.steps.length - 1) {
                navigateStep(1);
            } else {
                toggleAutoPlay(); // Finished
            }
        }, delay);
    }
}

// ==================== COMPARISON MODE RENDERING ====================
function renderComparisonTable(data) {
    const tbody = document.getElementById('comparisonTableBody');
    let html = '';

    data.results.forEach(res => {
        const isBest = res.algorithm === data.best_algorithm;
        const rowClass = isBest ? 'table-success bg-opacity-10' : '';

        html += `
            <tr class="${rowClass}">
                <td class="fw-bold">
                    <span class="text-teal">${res.algorithm}</span>
                    ${isBest ? '<span class="badge bg-warning text-dark ms-2"><i class="fas fa-trophy"></i> Best</span>' : ''}
                </td>
                <td class="text-center font-monospace fw-bold text-danger">${res.page_faults}</td>
                <td class="text-center font-monospace fw-bold text-success">${res.page_hits}</td>
                <td class="text-center font-monospace text-warning">${res.page_replacements}</td>
                <td class="text-center font-monospace text-teal">${res.hit_ratio}%</td>
                <td class="text-center font-monospace text-danger">${res.fault_ratio}%</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;

    // Best Algo Callout
    const best = data.results.find(r => r.algorithm === data.best_algorithm);
    const calloutEl = document.getElementById('bestAlgorithmCallout');
    if (best) {
        calloutEl.innerHTML = `
            <i class="fas fa-circle-check fs-5 text-success"></i>
            <div>
                <strong>${best.algorithm}</strong> achieved the best memory efficiency with only
                <strong>${best.page_faults} page faults</strong> (${best.hit_ratio}% Hit Ratio) across the reference sequence.
            </div>
        `;
    }
}

function renderComparisonBarChart(data) {
    const ctx = document.getElementById('compBarChart').getContext('2d');
    if (compBarChart) compBarChart.destroy();

    const labels = data.results.map(r => r.algorithm);
    const faults = data.results.map(r => r.page_faults);
    const hits = data.results.map(r => r.page_hits);

    compBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Page Faults',
                    data: faults,
                    backgroundColor: 'rgba(244, 63, 94, 0.75)',
                    borderColor: '#f43f5e',
                    borderWidth: 1.5,
                    borderRadius: 4
                },
                {
                    label: 'Page Hits',
                    data: hits,
                    backgroundColor: 'rgba(16, 185, 129, 0.75)',
                    borderColor: '#10b981',
                    borderWidth: 1.5,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#cbd5e1', font: { size: 11 } }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#94a3b8' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: '#94a3b8', stepSize: 1 },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                }
            }
        }
    });
}

// ==================== INDIVIDUAL CHARTS ====================
function renderHitFaultDoughnut(hits, faults) {
    const ctx = document.getElementById('hitFaultDoughnutChart').getContext('2d');
    if (hitFaultDoughnutChart) hitFaultDoughnutChart.destroy();

    hitFaultDoughnutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Page Hits', 'Page Faults'],
            datasets: [{
                data: [hits, faults],
                backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(244, 63, 94, 0.8)'],
                borderColor: ['#10b981', '#f43f5e'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#cbd5e1', boxWidth: 12 }
                }
            }
        }
    });
}

function renderCumulativeFaultLine(steps) {
    const ctx = document.getElementById('cumulativeFaultLineChart').getContext('2d');
    if (cumulativeFaultLineChart) cumulativeFaultLineChart.destroy();

    let cumulative = 0;
    const dataPoints = steps.map(step => {
        if (step.result === 'FAULT') cumulative++;
        return cumulative;
    });

    cumulativeFaultLineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: steps.map(s => `#${s.step}`),
            datasets: [{
                label: 'Cumulative Page Faults',
                data: dataPoints,
                borderColor: '#f43f5e',
                backgroundColor: 'rgba(244, 63, 94, 0.15)',
                borderWidth: 2.5,
                fill: true,
                tension: 0.25,
                pointBackgroundColor: '#f43f5e',
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#cbd5e1', font: { size: 11 } }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Simulation Step', color: '#94a3b8', font: { size: 10 } },
                    ticks: { color: '#94a3b8' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Fault Count', color: '#94a3b8', font: { size: 10 } },
                    ticks: { color: '#94a3b8', stepSize: 1 },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                }
            }
        }
    });
}

// ==================== RESET SIMULATION ====================
function resetSimulation() {
    currentSimulation = null;
    currentStep = 0;
    comparisonResults = null;

    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
        const playIcon = document.getElementById('playIcon');
        const playText = document.getElementById('playText');
        const autoPlayBtn = document.getElementById('btnAutoPlay');
        if (playIcon) playIcon.className = 'fas fa-play';
        if (playText) playText.textContent = 'Play';
        if (autoPlayBtn) autoPlayBtn.classList.remove('btn-danger');
    }

    // Destroy existing charts
    if (hitFaultDoughnutChart) { hitFaultDoughnutChart.destroy(); hitFaultDoughnutChart = null; }
    if (cumulativeFaultLineChart) { cumulativeFaultLineChart.destroy(); cumulativeFaultLineChart = null; }
    if (compBarChart) { compBarChart.destroy(); compBarChart = null; }

    // Toggle Visibility back to empty state
    document.getElementById('simContent').classList.add('d-none');
    document.getElementById('emptyState').classList.remove('d-none');

    // Reset default scenario if available
    if (hospitalScenarios.length > 0) {
        selectScenario(hospitalScenarios[0].id);
    }

    selectAlgorithm('FIFO');
    hideError();
    document.getElementById('refStringError').textContent = '';
}

// ==================== ERROR HANDLING ====================
function showError(message) {
    const errorBanner = document.getElementById('errorBanner');
    const errorText = document.getElementById('errorText');
    if (errorBanner && errorText) {
        errorText.textContent = message;
        errorBanner.classList.remove('d-none');
    }
}

function hideError() {
    const errorBanner = document.getElementById('errorBanner');
    if (errorBanner) {
        errorBanner.classList.add('d-none');
    }
}
