const REPO = 'https://github.com/nikbearbrown/Agents';
const STATUS = { planned: 'Planned · no code yet', 'source-available': 'Source available · not runtime-tested', 'reported-fixture-tested': 'Prior fixture reports', 'fixture-tested': 'Fixture-tested', 'live-tested': 'Live-tested' };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function initLibrary() {
  const res = await fetch('/data/agents/catalog.json');
  const all = await res.json();
  const q = document.getElementById('q'), cat = document.getElementById('cat'), size = document.getElementById('size');
  const out = document.getElementById('results'), count = document.getElementById('count'), more = document.getElementById('more');
  [...new Set(all.map(a => a.c))].sort().forEach(c => cat.insertAdjacentHTML('beforeend', `<option>${esc(c)}</option>`));
  const bucket = n => (n <= 6 ? 's' : n <= 15 ? 'm' : 'l');
  let shown = 24, list = all;
  const draw = () => {
    count.textContent = `${list.length.toLocaleString()} of ${all.length.toLocaleString()} agents`;
    out.innerHTML = list.slice(0, shown).map(a => `<article class="card"><span class="meta">${esc(a.c)} · ${a.n} nodes</span><h3><a href="/agents/view/?slug=${encodeURIComponent(a.s)}">${esc(a.t)}</a></h3><p>${esc(a.d)}</p><a class="card-link" href="/agents/view/?slug=${encodeURIComponent(a.s)}">Open and improve →</a></article>`).join('');
    more.hidden = shown >= list.length;
  };
  const filter = () => {
    const t = q.value.trim().toLowerCase();
    list = all.filter(a => (!cat.value || a.c === cat.value) && (!size.value || bucket(a.n) === size.value) &&
      (!t || (a.t + ' ' + a.d + ' ' + a.i.join(' ')).toLowerCase().includes(t)));
    shown = 24; draw();
  };
  [q, cat, size].forEach(el => el.addEventListener('input', filter));
  document.getElementById('agent-filters').addEventListener('submit', e => e.preventDefault());
  more.addEventListener('click', () => { shown += 24; draw(); });
  draw();
}

async function initAgent() {
  const slug = new URLSearchParams(location.search).get('slug');
  const title = document.getElementById('a-title'), body = document.getElementById('a-body');
  if (!slug || !/^[a-z0-9-]+$/i.test(slug)) { title.textContent = 'Agent not found'; return; }
  let d;
  try {
    const [cat, det] = await Promise.all([fetch('/data/agents/catalog.json').then(r => r.json()), fetch(`/data/agents/${slug}.json`).then(r => { if (!r.ok) throw 0; return r.json(); })]);
    d = det; d.meta = cat.find(a => a.s === slug);
  } catch { title.textContent = 'Agent not found'; return; }
  const name = d.meta ? d.meta.t : slug;
  document.title = `${name} | AI Skunk Works`;
  title.textContent = name;
  document.getElementById('a-purpose').textContent = d.purpose;
  const gh = `${REPO}/tree/main/agents/${slug}`;
  const issue = `${REPO}/issues/new?title=${encodeURIComponent('Claim: ' + name)}&body=${encodeURIComponent(`I would like to work on \`${slug}\`.\n\nPiece I am taking (review spec / fixtures / port to ___ / extension):\n`)}`;
  body.innerHTML = `
    <div class="callout"><h3>Work on this agent</h3><p>${esc(d.overview)}</p><p><a class="button" href="${issue}" target="_blank" rel="noopener">Claim a piece ↗</a> <a class="button secondary" href="${gh}" target="_blank" rel="noopener">Open files on GitHub ↗</a> <a class="button secondary" href="/agents/contribute/">How to contribute</a></p></div>
    <h2 style="margin-top:2.5rem">What is left to do</h2>
    <ul class="list">${d.unresolved.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    <p class="meta">Specification status: ${esc(d.status)}. Entry: ${esc(d.entry.join(', ') || '—')}. Ends at: ${esc(d.terminal.join(', ') || '—')}.</p>
    <h2 style="margin-top:2.5rem">Shared workflow</h2>
    <p>Observed connections from the n8n source. A starting point for the shared design; it does not show the agent is correct.</p>
    <div id="diagram" style="overflow:auto;border:1px solid var(--line);padding:1rem"></div>
    <h2 style="margin-top:2.5rem">Implementations to build or improve</h2>
    <div class="grid grid-3">${d.impl.map(i => `<article class="card"><h3>${esc(i.label)}</h3><p>${esc(STATUS[i.status] || i.status)}</p><a class="card-link" href="${REPO}/tree/main/${esc(i.path)}" target="_blank" rel="noopener">${i.status === 'planned' ? 'Read the plan and build it ↗' : 'Read the source and improve it ↗'}</a></article>`).join('')}</div>`;
  if (window.mermaid) {
    try {
      mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
      const { svg } = await mermaid.render('agent-diagram', d.mermaid);
      document.getElementById('diagram').innerHTML = svg;
    } catch { document.getElementById('diagram').innerHTML = `<pre style="white-space:pre-wrap">${esc(d.mermaid)}</pre>`; }
  }
}
if (document.getElementById('results')) initLibrary();
if (document.getElementById('a-body')) initAgent();
