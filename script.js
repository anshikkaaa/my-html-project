
const stepNames = [
  'Journey & Outcomes',
  'Assessment',
  'Upload (Optional)',
  'Review',
  'Score',
  'Effort',
  'Summary'
];

let step = 0;
let journey = 'Modernisation';
let category = 0;
let files = [];
let expanded = new Set([0]);
let selected = new Set([0, 1, 2, 4, 6]);

const outcomes = [
  ['AI & Cloud Readiness Assessment',
   'Assesses business, data, application, cloud, AI security and operating model readiness.', '🏛'],
  ['Data Discovery, STTM & Lineage Baseline',
   'Establishes a trusted baseline of systems, sources, mappings, lineage and dependencies.', '▤'],
  ['Cloud Data Platform & Data Products',
   'Builds and operates a scalable cloud data platform spanning ingestion, governance and data products.', '☁'],
  ['Application Rationalisation & Legacy Modernisation',
   'Analyses legacy workloads and selects the right modernisation path.', '♧'],
  ['Data Governance, Quality, MDM & Contracts',
   'Establishes trusted data through quality, ownership, stewardship and privacy controls.', '♢'],
  ['Semantic Layer & KPI Governance',
   'Creates governed metrics, semantic models, business definitions and KPIs.', '▣'],
  ['Enterprise Knowledge & Context Layer (RAG / Vector DB)',
   'Combines structured and unstructured information for AI-powered search and reasoning.', '♧']
];

const cats = [
  {
    name: 'Business & Functional Context',
    qs: [
      ['Roughly how many distinct business entities would a target model for this scope need to cover?',
       ['5 or fewer', '6–15', '16–30', '30+, or nobody can say', 'Other']],
      ['What is the approximate scope and structural complexity of assets for profiling and lineage?',
       ['Single application or workload with limited dependencies', 'Multiple related applications in one domain', 'Cross-platform workload with databases, files, ETL, jobs and reports', 'Cross-domain estate with complex transformations or external dependencies', 'Enterprise-wide or unknown scope']],
      ['What is the scope of the application, database, data-store and platform landscape?',
       ['One application or data store', 'A small set of related systems', 'Multiple applications, databases and integrations across a business function', 'Several business functions', 'Enterprise-wide landscape']],
      ['How many business processes are included, and are they documented?',
       ['One documented process', '2–3 related processes, one to two domains', 'Several processes across domains', 'Many processes with limited documentation', 'Unknown']],
      ['How do people currently know these processes?',
       ['Trusted SOPs, informal notes, or purely in people’s heads', 'Mostly documented processes', 'Well-maintained central documentation', 'Mixed documentation and tribal knowledge', 'No usable documentation']],
      ['What are the key business outcomes for this project?',
       ['Improve efficiency and reduce operational risk', 'Reduce cost', 'Improve customer experience', 'Modernise technology', 'Multiple outcomes']]
    ]
  },
  {
    name: 'Data Definitions & Models',
    qs: [
      ['How consistent are business definitions across systems?',
       ['Consistent and documented', 'Mostly consistent', 'Some conflicting definitions', 'Many conflicting definitions', 'Unknown']],
      ['How available are source-to-target mappings and lineage details?',
       ['Complete and current', 'Mostly available', 'Partially available', 'Very limited', 'Not known']],
      ['How complex are the data transformations and business rules?',
       ['Simple rules', 'Moderate rules', 'Complex rules across systems', 'Highly dynamic or undocumented', 'Unknown']]
    ]
  },
  {
    name: 'Runtime, NFR & Operations',
    qs: [
      ['What are the runtime and availability requirements?',
       ['Business-hours use', 'Daily scheduled workloads', 'Near-real-time requirements', '24/7 high availability', 'Unknown']],
      ['How mature is monitoring and alerting today?',
       ['Established monitoring and runbooks', 'Mostly monitored', 'Some monitoring gaps', 'Limited monitoring', 'No monitoring']],
      ['What security and access controls are required?',
       ['Standard role-based access', 'Multiple data classifications', 'Sensitive data and complex controls', 'Highly regulated or strict controls', 'Unknown']],
      ['How ready are environments and deployment processes?',
       ['Environments and CI/CD ready', 'Minor setup needed', 'Some dependencies remain', 'Major setup needed', 'Unknown']]
    ]
  }
];

const answers = cats.map((c, i) =>
  c.qs.map((q, j) => ['B', 'A', 'C', 'B', 'A', 'A'][j] || 'A')
);

const stages = [
  ['Discover', '3.5', 'M', 35, '⌕'],
  ['Construct', '3.7', 'M', 55, '⬡'],
  ['Contractualise', '—', '—', null, '▤'],
  ['Engineer', '—', '—', null, '⚙'],
  ['Validate', '—', '—', null, '♢'],
  ['Operate', '—', '—', null, '☁']
];

const signals = [
  ['Scope Clarity', 3.5, 'Defined scope, clear goals, owners and acceptance criteria.', '◎'],
  ['Risk Maturity', 3.1, 'Assign risk owners, mitigations and target dates.', '♜'],
  ['Governance Maturity', 3.5, 'Governance approaches and evidence requirements.', '♙'],
  ['Client Dependency', 3.6, 'Confirm client actions, coordination and due dates.', '♟'],
  ['Infrastructure Readiness', 3.5, 'Confirm platform, integration resources, actions and dates.', '▤'],
  ['Content Readiness', 3.8, 'Assign owners for missing context and validation.', '▣']
];

function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  }[c]));
}

function nav() {
  document.querySelector('#steps').innerHTML =
    stepNames.map((s, i) =>
      `<div class="step ${i === step ? 'active' : i < step ? 'done' : ''}">
        <span class="num">${i < step ? '✓' : i + 1}</span>${s}
      </div>`
    ).join('');
}

function heading(icon, title, sub) {
  return `<div class="heading">
    <div class="headicon">${icon}</div>
    <div><h1>${title}</h1><p class="muted">${sub}</p></div>
  </div>`;
}

function actions(back, next, label = 'Next', hint = '') {
  return `<div class="actions">
    <span class="hint">${hint}</span>
    <div class="right">
      ${back ? `<button class="btn" onclick="go(${step - 1})">← Back</button>` : ''}
      <button class="btn primary" onclick="${next}">${label} →</button>
    </div>
  </div>`;
}

function journeyPage() {
  const js = [
    ['Migration', '☁', 'Move to modern platforms, enable cloud adoption and ensure a secure, scalable transition.'],
    ['Modernisation', '⚙', 'Reimagine applications and infrastructure for greater agility, performance and innovation.'],
    ['Consumption', '▤', 'Leverage existing assets and ready-to-use services for faster business outcomes.'],
    ['DataOps', '♧', 'Enable data pipelines, governance and automation for trusted, real-time data.']
  ];

  return `<section class="panel">
    <div class="sectionhead">
      <span class="badge">1</span>
      <div><b>Step 1 of 2</b><h2>Select the delivery journey</h2>
      <span class="muted">Choose the primary engagement type.</span></div>
    </div>

    <div class="journeys">
      ${js.map(([n, i, d]) => `
        <button class="journey ${journey === n ? 'selected' : ''}"
          ${n === 'DataOps' ? 'disabled' : `onclick="journey='${n}';render()"`}>
          <span class="jicon">${i}</span>
          <span><strong>${n}</strong><p>${d}</p></span>
          ${journey === n ? '<span class="tick">✓</span>' : ''}
        </button>
      `).join('')}
    </div>

    <hr style="border:0;border-top:1px solid #e5eef6;margin:22px 0">

    <div class="sectionhead">
      <span class="badge">2</span>
      <div><b>Step 2 of 2</b><h2>Select the delivery outcomes</h2>
      <span class="muted">Some outcomes may be selected automatically based on dependencies.</span></div>
    </div>

    <div class="info">ⓘ Outcomes build on each other — selecting one may require related outcomes.</div>

    <div class="tools">
      <button class="link" onclick="selected=new Set(outcomes.map((_,i)=>i));render()">Select all</button> |
      <button class="link" onclick="selected.clear();render()">Clear all</button>
      <span class="count">${selected.size} selected</span>
    </div>

    <div class="outcomes">
      ${outcomes.map(([n, d, ic], i) => `
        <label class="outcome">
          <input type="checkbox" ${selected.has(i) ? 'checked' : ''}
            onchange="toggle(${i},this.checked)">
          <span class="oicon">${ic}</span>
          <span class="copy">
            <strong>${n}${[0,2,4].includes(i) ? '<span class="tag">◇ Recommended dependency</span>' : ''}</strong>
            <small>${d}</small>
          </span>
          <span>›</span>
        </label>
      `).join('')}
    </div>

    ${actions(false, 'go(1)', 'Next', 'Select outcomes to continue')}
  </section>`;
}

function toggle(i, v) {
  v ? selected.add(i) : selected.delete(i);
  render();
}

function answered(i) {
  return answers[i].filter(Boolean).length;
}

function assessment() {
  const c = cats[category];

  return `${heading('☷', 'Agentic Delivery Short Estimator',
    'Answer the questions below to complete the assessment. Your responses help refine the scope and estimate.')}

    <div class="layout">
      <aside>
        ${cats.map((x, i) => `
          <button class="category ${i === category ? 'active' : ''}"
            onclick="category=${i};render()">
            <span class="num">${i + 1}</span>
            <span>
              <strong>${x.name}</strong>
              <small>${answered(i)} / ${x.qs.length} answered</small>
              <span class="progress" style="display:block">
                <span style="width:${answered(i) / x.qs.length * 100}%"></span>
              </span>
            </span>
          </button>
        `).join('')}
      </aside>

      <section>
        <div class="qsection">
          <div class="qtitle">
            ${category + 1}. ${c.name}
            <span>${answered(category)} / ${c.qs.length} answered</span>
          </div>

          ${c.qs.map((q, j) => `
            <div class="question">
              <h3>${j + 1}. ${q[0]}</h3>
              <div class="options">
                ${q[1].map((o, k) => {
                  const key = String.fromCharCode(65 + k);
                  return `<label class="option">
                    <input type="radio" name="q${category}-${j}"
                      ${answers[category][j] === key ? 'checked' : ''}
                      onchange="answers[${category}][${j}]='${key}'">
                    <span class="letter">${key}</span>${o}
                  </label>`;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="actions">
          <span class="hint">ⓘ Responses are saved automatically.</span>
          <div class="right">
            <button class="btn" onclick="go(0)">← Back</button>
            ${category < 2
              ? `<button class="btn primary" onclick="category++;render()">Next category →</button>`
              : `<button class="btn primary" onclick="go(2)">Next →</button>`}
          </div>
        </div>
      </section>
    </div>`;
}

function upload() {
  return `${heading('⇧', 'Upload documents (optional)',
    'Add RFPs, requirements or architecture notes for additional insights. You can skip this step.')}

    <div class="uploadgrid">
      <section class="panel">
        <div class="drop" ondragover="event.preventDefault()" ondrop="drop(event)">
          <div class="headicon">⇧</div>
          <h2>Drag and drop files here or browse</h2>
          <p class="muted">PDF, DOCX, TXT or MD — max 10 MB per file</p>
          <label class="btn primary" for="fileinput">⇧ Upload Documents</label>
          <input class="hidden" id="fileinput" type="file" multiple
            accept=".pdf,.docx,.txt,.md" onchange="addFiles(this.files)">
        </div>
      </section>

      <section class="panel">
        <h2>Uploaded Documents (${files.length})</h2>
        ${files.map((f, i) => `
          <div class="file">
            <b>${esc(f.name.split('.').pop().toUpperCase())}</b>
            <span>${esc(f.name)}
              <small>${(f.size / 1048576).toFixed(2)} MB · Added just now</small>
            </span>
            <button onclick="files.splice(${i},1);render()">✕</button>
          </div>
        `).join('')}
        <div class="info">ⓘ Files are shown locally in this demo and are not uploaded to a server.</div>
      </section>
    </div>

    ${actions(true, 'go(3)', 'Skip', 'Optional — upload documents or skip to review.')}`;
}

function addFiles(list) {
  for (const f of list) {
    if (f.size > 10485760) {
      toast(f.name + ' exceeds 10 MB.');
      continue;
    }

    if (!/\.(pdf|docx|txt|md)$/i.test(f.name)) {
      toast('Use PDF, DOCX, TXT or MD files.');
      continue;
    }

    files.push(f);
  }

  render();
}

function drop(e) {
  e.preventDefault();
  addFiles(e.dataTransfer.files);
}

function review() {
  return `${heading('☷', 'Review Assessment',
    'Review your responses before moving to the score and effort estimate.')}

    <div class="layout">
      <aside class="panel">
        <h2>Assessment Completed</h2>
        <h1>${answers.flat().filter(Boolean).length} / 13</h1>
        <p class="muted">Questions answered</p>

        ${cats.map((c, i) => `
          <button class="category" onclick="category=${i};go(1)">
            <span class="num">${i + 1}</span>
            <span><strong>${c.name}</strong>
            <small>${answered(i)} / ${c.qs.length} answered</small></span>
          </button>
        `).join('')}
      </aside>

      <section>
        ${cats.map((c, i) => `
          <div class="reviewitem">
            <button class="reviewhead"
              onclick="expanded.has(${i})?expanded.delete(${i}):expanded.add(${i});render()">
              <span class="num">${i + 1}</span>
              <strong>${c.name}</strong>
              ${answered(i)} / ${c.qs.length} answered
              ${expanded.has(i) ? '⌃' : '⌄'}
            </button>

            ${expanded.has(i) ? c.qs.map((q, j) => {
              const key = answers[i][j] || 'A';
              return `<div class="answer">
                <span>${j + 1}.</span>
                <span>${q[0]}</span>
                <span>${key}. ${q[1][key.charCodeAt(0) - 65]}</span>
              </div>`;
            }).join('') : ''}
          </div>
        `).join('')}

        ${actions(true, 'go(4)', 'Next', 'You can return to Assessment to edit answers.')}
      </section>
    </div>`;
}

function score() {
  return `<div class="hero">
      <div>
        <small>EXL Engagement Estimate</small>
        <h2>Readiness Score</h2>
        <p>Based on 13 complexity signals · EXL data.ai delivery benchmark</p>
      </div>
      <div class="confidence"><strong>80%</strong><small>Confidence</small></div>
      <div class="tshirt">T-Shirt Size<strong>M</strong><small>Medium</small></div>
    </div>

    <div class="scoregrid">
      <section class="panel">
        <h2>Readiness Signals</h2>
        <p class="muted">How well your project aligns with EXL's delivery model.</p>

        <div class="signals">
          ${signals.map(s => `
            <div class="signal">
              <span class="ico">${s[3]}</span>
              <span><strong>${s[0]}</strong><small>${s[2]}</small></span>
              <span class="bar"><span style="width:${s[1] / 5 * 100}%"></span></span>
              <span class="signalscore">${s[1].toFixed(1)} / 5</span>
              <span>›</span>
            </div>
          `).join('')}
        </div>

        <div class="metricrow">
          <div class="metric dark"><span>Overall score</span>
            <strong>64.82 <small>/ 100</small></strong></div>
          <div class="metric dark"><span>T-Shirt Size</span>
            <strong>M <small>(Medium)</small></strong></div>
          <div class="metric dark"><span>Confidence</span>
            <strong>80% <small>(High)</small></strong></div>
        </div>
      </section>

      <aside class="panel">
        <h2>💡 Score Insights</h2>
        <div class="good"><b>✓ Good readiness overall!</b><br>
          Your project aligns with the delivery model. Focus on risk maturity and infrastructure readiness.
        </div>

        <h2 style="margin-top:20px">Key Strengths</h2>
        <div class="bullet">✓ Clear scope and objectives</div>
        <div class="bullet">✓ Governance and communication plan</div>
        <div class="bullet">✓ Client engagement and ownership</div>

        <h2 style="margin-top:20px">Areas to Improve</h2>
        <div class="bullet">› Risk maturity (3.1/5)</div>
        <div class="bullet">› Infrastructure readiness (3.5/5)</div>
        <div class="bullet">› Content readiness (3.8/5)</div>

        <div class="info">Next step: review effort estimation and resource planning.</div>
        <button class="link" onclick="go(5)">Go to Effort →</button>
      </aside>
    </div>

    ${actions(true, 'go(5)', 'Next', 'Score values are demo values.')}`;
}

function effort() {
  const total = stages.reduce((n, s) => n + (s[3] || 0), 0);

  return `${heading('◴', 'Effort Estimation',
    'Estimated delivery effort by lifecycle stage.')}

    <div class="threemetrics">
      <div class="effortmetric"><span class="bigicon">▦</span>
        <div>Total Estimated Effort<strong>${total} <small>person-days</small></strong></div>
      </div>
      <div class="effortmetric"><span class="bigicon">▱</span>
        <div>Active Stages<strong>2 <small>of 6</small></strong></div>
      </div>
      <div class="effortmetric"><span class="bigicon">♧</span>
        <div>Typical T-shirt Size<strong>M</strong></div>
      </div>
    </div>

    <div class="effortgrid">
      <section class="panel">
        <h2>Effort by Stage</h2>
        <table class="table">
          <thead><tr><th>Stage</th><th>Score</th><th>T-shirt</th><th>Person-days</th></tr></thead>
          <tbody>
            ${stages.map(s => `
              <tr class="${s[3] ? 'activeStage' : 'mutedStage'}">
                <td>${s[4]} ${s[0]}</td><td>${s[1]}</td><td>${s[2]}</td>
                <td>${s[3] ?? '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>

      <section class="panel">
        <h2>Effort Distribution
          <small style="float:right;font-size:12px">Total: ${total} person-days</small>
        </h2>

        ${stages.filter(s => s[3]).map((s, i) => `
          <div class="dist">
            <span>${s[4]} ${s[0]}</span>
            <span class="bar"><span style="width:${s[3] / total * 100}%;background:${i ? '#16a887' : '#268de0'}"></span></span>
            <b>${s[3]} days<br><small>(${Math.round(s[3] / total * 100)}%)</small></b>
          </div>
        `).join('')}

        <hr style="border:0;border-top:1px solid #e5eef6;margin:22px 0">
        <h2>Remaining Stages</h2>

        ${stages.filter(s => !s[3]).map(s => `
          <div class="dist mutedStage">
            <span>${s[4]} ${s[0]}</span><span></span><span>Not estimated</span>
          </div>
        `).join('')}
      </section>
    </div>

    <div class="info">ⓘ Effort estimates are based on assessment responses and industry benchmarks. Validate them during discovery.</div>

    ${actions(true, 'go(6)', 'Next', 'Estimates are indicative, not a project commitment.')}`;
}

function summary() {
  const total = stages.reduce((n, s) => n + (s[3] || 0), 0);

  return `${heading('▤', 'Summary',
    'Here is a consolidated view of your assessment, readiness and estimated effort.')}

    <div class="summarymetrics">
      <div class="summarymetric"><span class="bigicon">◴</span>
        <div><small>Readiness Score</small><strong>64.82 <small>/ 100</small></strong>
        <small>T-shirt Size: M</small></div>
      </div>
      <div class="summarymetric"><span class="bigicon">▦</span>
        <div><small>Estimated Effort</small><strong>${total} <small>person-days</small></strong>
        <small>Based on 2 stages</small></div>
      </div>
      <div class="summarymetric"><span class="bigicon">♧</span>
        <div><small>T-shirt Size</small><strong>M</strong><small>Medium</small></div>
      </div>
      <div class="summarymetric"><span class="bigicon">◎</span>
        <div><small>Overall Confidence</small><strong>80%</strong><small>High</small></div>
      </div>
    </div>

    <div class="twocol">
      <section class="panel">
        <h2>▥ Readiness Signals</h2>
        <p class="muted">How well your project aligns with the delivery model.</p>
        ${signals.map(s => `
          <div class="summarysignal">
            <span>${s[3]}</span><span>${s[0]}</span>
            <span class="bar"><span style="width:${s[1] / 5 * 100}%"></span></span>
            <b>${s[1].toFixed(1)}/5</b>
          </div>
        `).join('')}
      </section>

      <section class="panel">
        <h2>◷ Effort by Stage</h2>
        <p class="muted">Estimated effort in person-days.</p>
        <table class="table">
          <thead><tr><th>Stage</th><th>Score</th><th>T-shirt</th><th>Person-days</th></tr></thead>
          <tbody>
            ${stages.map(s => `
              <tr class="${s[3] ? 'activeStage' : 'mutedStage'}">
                <td>${s[0]}</td><td>${s[1]}</td><td>${s[2]}</td><td>${s[3] ?? '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="info">ⓘ Estimate based on assessment responses and industry benchmarks.</div>
      </section>
    </div>

    <div class="twocol" style="margin-top:16px">
      <section class="panel">
        <h2>💡 Key Insights</h2>
        <ul class="insights">
          <li>Strong alignment with the delivery model.</li>
          <li>Focus on risk maturity and infrastructure readiness.</li>
          <li>Good client engagement and clear scope definition.</li>
        </ul>
      </section>
      <section class="panel">
        <h2>🚀 Next Steps</h2>
        <p class="muted">Review the detailed assessment and effort breakdown or download a summary report.</p>
        <button class="btn" onclick="downloadReport()">⇩ Download Summary</button>
      </section>
    </div>

    <div class="actions">
      <span class="hint">Review the estimate before finishing.</span>
      <div class="right">
        <button class="btn" onclick="go(5)">← Back</button>
        <button class="btn primary" onclick="toast('Demo complete — summary reviewed.')">Finish ✓</button>
      </div>
    </div>`;
}

function downloadReport() {
  const text = `EXL Agentic Delivery Estimator — Demo Summary
Journey: ${journey}
Readiness: 64.82/100
Confidence: 80%
Estimated effort: 90 person-days

Effort by stage:
${stages.map(s => s[0] + ': ' + (s[3] || 'Not estimated') + ' person-days').join('\n')}

This is a UI demo estimate; validate before project planning.`;

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  a.download = 'estimator-summary.txt';
  a.click();
  URL.revokeObjectURL(a.href);
}

function go(n) {
  step = n;
  render();
}

function toast(t) {
  const e = document.querySelector('#toast');
  e.textContent = t;
  e.classList.add('show');
  setTimeout(() => e.classList.remove('show'), 2400);
}

function render() {
  nav();

  document.querySelector('#app').innerHTML = [
    journeyPage,
    assessment,
    upload,
    review,
    score,
    effort,
    summary
  ][step]();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

render();
