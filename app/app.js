// Leonida Ledger — GTA VI trophy guide & tracker. Static, offline: it fetches
// only data/trophies.json from its own files, and keeps progress, notes and
// settings in this browser's localStorage. No network, no Rockstar artwork.
const KEY_EARNED = 'leonida-ledger-earned-v1';
const KEY_NOTES = 'leonida-ledger-notes-v1';
const KEY_SPOILER = 'leonida-ledger-spoilers-v1';
const KEY_THEME = 'leonida-ledger-theme-v1';

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const byId = new Map(trophies.map(t => [t.id, t]));

let earned = new Set(JSON.parse(localStorage.getItem(KEY_EARNED) ?? '[]'));
let notes = JSON.parse(localStorage.getItem(KEY_NOTES) ?? '{}');
let spoilers = localStorage.getItem(KEY_SPOILER) !== 'off';
let theme = localStorage.getItem(KEY_THEME) ?? 'paper';

const view = document.getElementById('view');
const filters = { q: '', grade: 'all', kind: 'all', status: 'all' };

const KIND_LABELS = {
  story: 'Story', side: 'Side quest', activity: 'Activity', collectible: 'Collectible',
  crime: 'Crime & robbery', money: 'Money', explore: 'Exploring', misc: 'Miscellaneous',
  completion: '100% completion', platinum: 'Platinum',
};
// Where each trophy sits in the three-step roadmap, shown as a tag so a
// reader can tell at a glance whether to do it now or leave it for cleanup.
const STAGE_LABELS = {
  1: 'Roadmap: story',
  2: 'Roadmap: alongside the story',
  3: 'Roadmap: strangers',
  4: 'Roadmap: cleanup',
  5: 'Roadmap: platinum',
};
const GRADE_LABELS = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };

function save() {
  localStorage.setItem(KEY_EARNED, JSON.stringify([...earned]));
  localStorage.setItem(KEY_NOTES, JSON.stringify(notes));
  localStorage.setItem(KEY_SPOILER, spoilers ? 'on' : 'off');
  localStorage.setItem(KEY_THEME, theme);
}
function isEarned(t) { return earned.has(t.id); }
function isHidden(t) { return spoilers && t.story && !isEarned(t); }
function toggleEarned(t) {
  if (isEarned(t)) earned.delete(t.id); else earned.add(t.id);
  save(); renderHeader(); render();
}
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}
function gradeDot(t) {
  const s = el('span', 'grade-dot');
  s.title = GRADE_LABELS[t.grade];
  return s;
}
function tagsFor(t) {
  const wrap = el('div', 'tags');
  wrap.append(el('span', 'tag', GRADE_LABELS[t.grade]));
  // The platinum trophy's kind is "platinum" too, so its kind tag would
  // repeat the grade tag word for word — skip it there.
  if (t.kind !== t.grade) wrap.append(el('span', 'tag', KIND_LABELS[t.kind] ?? t.kind));
  if (t.story) wrap.append(el('span', 'tag story', 'Story'));
  if (t.missable) wrap.append(el('span', 'tag missable', 'Possibly missable'));
  if (t.hidden) wrap.append(el('span', 'tag hidden', 'Hidden on PSN'));
  if (t.stage) wrap.append(el('span', 'tag', STAGE_LABELS[t.stage] ?? `Stage ${t.stage}`));
  if (t.target) {
    const u = t.target.unit ?? '';
    const of = t.target.of ? ` of ${t.target.of}` : '';
    wrap.append(el('span', 'tag', `Target: ${t.target.count}${u}${of} ${t.target.label}`));
  }
  return wrap;
}
function sourceList(t) {
  const div = el('div', 'sources');
  div.append(el('strong', null, 'Sources: '));
  const ul = el('ul');
  for (const s of t.sources) {
    const li = el('li');
    const a = document.createElement('a');
    a.href = s.u; a.textContent = s.n; a.target = '_blank'; a.rel = 'noopener';
    li.append(a);
    ul.append(li);
  }
  div.append(ul);
  return div;
}

// ---------- header ----------
function renderHeader() {
  const n = earned.size;
  document.getElementById('earnedCount').textContent = n;
  document.title = n ? `Leonida Ledger — ${n} of 55 trophies earned` : 'Leonida Ledger — GTA VI Trophy Guide & Tracker';
  document.getElementById('barFill').style.width = `${(n / trophies.length) * 100}%`;
  const counts = ['platinum', 'gold', 'silver', 'bronze'].map(g => {
    const got = trophies.filter(t => t.grade === g && isEarned(t)).length;
    const tot = trophies.filter(t => t.grade === g).length;
    return `${GRADE_LABELS[g]} ${got}/${tot}`;
  }).join(' · ');
  document.getElementById('gradeCounts').textContent = counts;
  document.getElementById('platinumLine').innerHTML = '';
  const line = document.getElementById('platinumLine');
  if (n === trophies.length) {
    const s = el('strong', null, 'Vice Got a Price! — you are a Leonida Legend.');
    line.append(s);
  } else {
    line.textContent = `${trophies.length - n} to go until the platinum.`;
  }
}

// ---------- tracker ----------
function trophyRow(t) {
  const row = el('article', `trophy grade-${t.grade}${isEarned(t) ? ' earned' : ''}`);
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = isEarned(t);
  box.setAttribute('aria-label', `Mark ${t.name} as earned`);
  box.addEventListener('change', () => toggleEarned(t));
  row.append(box);
  const body = el('div', 'trophy-body');
  const name = el('div', 'trophy-name');
  name.append(gradeDot(t));
  if (isHidden(t)) {
    name.append(document.createTextNode('Story trophy — hidden until earned'));
    body.append(name);
    body.append(el('p', 'hidden-note', 'Turn off “Hide story spoilers” above, or tick the box once you have earned it, to reveal its name and guide.'));
  } else {
    name.append(document.createTextNode(t.name));
    body.append(name);
    body.append(el('p', 'trophy-desc', `“${t.description}”`));
    body.append(el('p', 'trophy-guide', t.guide));
    body.append(tagsFor(t));
    const link = el('a', 'guide-link', 'Full guide & sources →');
    link.href = `#/guide/${t.id}`;
    body.append(link);
  }
  row.append(body);
  return row;
}
function nextUp() {
  const rest = trophies.filter(t => !isEarned(t));
  if (!rest.length) return null;
  const missable = rest.find(t => t.missable);
  const story = rest.filter(t => t.story);
  const picks = [];
  if (missable) picks.push([missable, 'Do this first — it is the only trophy that can be missed.']);
  if (story.length) {
    // Never print a hidden story trophy's name while the spoiler setting is on.
    if (isHidden(story[0])) picks.push([null, 'Next story trophy in chapter order (name hidden — spoiler setting is on).']);
    else picks.push([story[0], 'Next story trophy in chapter order.']);
  }
  const quick = rest.filter(t => !t.story && t.kind !== 'completion' && t.id !== 1)
    .sort((a, b) => (a.target?.count ?? 1) - (b.target?.count ?? 1));
  if (quick.length && picks.length < 3) picks.push([quick[0], 'A quick one while you are out in Leonida.']);
  return picks.slice(0, 3);
}
function renderTracker() {
  view.replaceChildren();
  const h = el('h2', null, 'Tracker — all 55 trophies');
  view.append(h);
  const intro = el('p', null, 'Tick a trophy off when it pops; your progress is saved in this browser. Every trophy shows its official name, description and grade, its guide in our own words, and its sources.');
  view.append(intro);

  const nu = nextUp();
  if (nu) {
    const box = el('section', 'nextup');
    box.append(el('h2', null, 'Next up'));
    const ol = el('ol');
    for (const [t, why] of nu) {
      const li = el('li');
      if (t) {
        const a = document.createElement('a');
        a.href = `#/guide/${t.id}`;
        a.textContent = t.name;
        li.append(a, document.createTextNode(` — ${why}`));
      } else {
        li.append(document.createTextNode(why));
      }
      ol.append(li);
    }
    box.append(ol);
    view.append(box);
  }

  const controls = el('div', 'controls');
  const search = document.createElement('input');
  search.type = 'search'; search.placeholder = 'Search trophies, missions, places…';
  search.value = filters.q; search.setAttribute('aria-label', 'Search trophies');
  // Typing rebuilds this whole view, so the search box itself is recreated on
  // every keystroke — without this, focus is lost after the first character.
  search.addEventListener('input', () => {
    filters.q = search.value;
    const caret = search.selectionStart;
    render();
    const again = document.querySelector('.controls input[type="search"]');
    if (again) { again.focus(); again.setSelectionRange(caret, caret); }
  });
  controls.append(search);
  const grade = document.createElement('select');
  grade.setAttribute('aria-label', 'Filter by grade');
  for (const [v, label] of [['all', 'All grades'], ['platinum', 'Platinum'], ['gold', 'Gold'], ['silver', 'Silver'], ['bronze', 'Bronze']]) {
    const o = document.createElement('option'); o.value = v; o.textContent = label; grade.append(o);
  }
  grade.value = filters.grade;
  grade.addEventListener('change', () => { filters.grade = grade.value; render(); });
  controls.append(grade);
  const kind = document.createElement('select');
  kind.setAttribute('aria-label', 'Filter by kind');
  const kindOpts = [['all', 'All kinds'], ['story', 'Story'], ['missable', 'Missable'], ['collectible', 'Collectibles'], ['activity', 'Activities'], ['side', 'Side quests'], ['crime', 'Crime & robberies'], ['money', 'Money'], ['explore', 'Exploring'], ['misc', 'Miscellaneous']];
  for (const [v, label] of kindOpts) {
    const o = document.createElement('option'); o.value = v; o.textContent = label; kind.append(o);
  }
  kind.value = filters.kind;
  kind.addEventListener('change', () => { filters.kind = kind.value; render(); });
  controls.append(kind);
  const status = document.createElement('select');
  status.setAttribute('aria-label', 'Filter by earned status');
  for (const [v, label] of [['all', 'Earned + remaining'], ['remaining', 'Remaining only'], ['earned', 'Earned only']]) {
    const o = document.createElement('option'); o.value = v; o.textContent = label; status.append(o);
  }
  status.value = filters.status;
  status.addEventListener('change', () => { filters.status = status.value; render(); });
  controls.append(status);
  view.append(controls);

  const q = filters.q.trim().toLowerCase();
  const list = trophies.filter(t => {
    if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
    if (filters.kind === 'missable' && !t.missable) return false;
    if (filters.kind !== 'all' && filters.kind !== 'missable' && t.kind !== filters.kind) return false;
    if (filters.status === 'earned' && !isEarned(t)) return false;
    if (filters.status === 'remaining' && isEarned(t)) return false;
    if (q && !(t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().includes(q)) return false;
    return true;
  });
  view.append(el('p', 'resultline', `Showing ${list.length} of 55 trophies · ${earned.size} earned · ${list.filter(isEarned).length} of the shown ones earned.`));
  for (const t of list) view.append(trophyRow(t));
  if (!list.length) view.append(el('p', null, 'Nothing matches those filters. Clear the search or widen the filters.'));
}

// ---------- guide detail ----------
function renderGuide(id) {
  const t = byId.get(id);
  view.replaceChildren();
  if (!t) { view.append(el('p', null, 'No such trophy.')); return; }
  const back = el('a', 'guide-link', '← Back to the tracker');
  back.href = '#/tracker';
  view.append(back);
  const d = el('article', 'detail');
  d.append(el('h2', null, isHidden(t) ? 'Story trophy — hidden until earned' : t.name));
  if (isHidden(t)) {
    d.append(el('p', 'hidden-note', 'This is a story trophy. Turn off “Hide story spoilers” above, or tick it as earned on the tracker, to reveal its name and guide.'));
  } else {
    d.append(el('p', 'trophy-desc', `“${t.description}”`));
    d.append(tagsFor(t));
    d.append(el('p', 'guide-text', t.guide));
    if (t.missable) {
      d.append(el('p', null, '⚠ Possibly missable — see the Missables page for the full warning.'));
    }
    d.append(sourceList(t));
  }
  const noteLabel = el('label', null, 'Your note on this trophy');
  const note = document.createElement('textarea');
  note.value = notes[t.id] ?? '';
  note.placeholder = 'Where you found it, what worked, what to try next…';
  note.addEventListener('input', () => { notes[t.id] = note.value; save(); });
  noteLabel.append(note);
  d.append(noteLabel);
  const pager = el('div', 'pager');
  const prev = byId.get(t.id - 1), next = byId.get(t.id + 1);
  if (prev) { const a = el('a', 'guide-link', `← ${isHidden(prev) ? 'Previous story trophy' : prev.name}`); a.href = `#/guide/${prev.id}`; pager.append(a); } else pager.append(el('span'));
  if (next) { const a = el('a', 'guide-link', `${isHidden(next) ? 'Next story trophy' : next.name} →`); a.href = `#/guide/${next.id}`; pager.append(a); }
  d.append(pager);
  view.append(d);
}

// ---------- roadmap ----------
function renderRoadmap() {
  view.replaceChildren();
  view.append(el('h2', null, 'Roadmap to the platinum'));
  view.append(el('p', null, 'About 200 hours at a 4/10 difficulty, in one playthrough, all offline. There are no mission gold medals and no mission replay, and cheats disable trophies and saving — keep them off for the whole run. The story takes 60–80 hours across 5 chapters; the 100% checklist is the long tail. Sources: PowerPyx — GTA 6 Trophy Guide & Roadmap, checked against Push Square.'));
  const steps = [
    ['Step 1 — Finish the story, and mind the one missable [60–80 hours]',
     'Play the story through its 5 chapters and enjoy it. The 100% checklist is not viewable until after the story, but progress made during the story already counts. While you play: scan new vehicles with the WAiNK app (hold up, then R1) and study new animals with the binoculars (hold L1 for the wheel, zoom with up, hold R1 to study) — you need 200 of 277 vehicles and 100 of 255 animals for 100%. Do the Chapter 1 meditation at Jason’s house (see Missables) — it is the only thing in the game that can be missed. Keep a manual save at the start and end of each chapter: 15 manual save slots plus 1 autosave, and there is no mission replay to fall back on.'],
    ['Step 2 — The 100% Completion checklist [about 100 hours]',
     'After the story, the checklist appears under Progress > Stats > 100% Completion. It is far kinder than true 100% — roughly 60% of the game. You need any 70 of 80 challenges, 300 stunts, any 200 of 277 base-model vehicles scanned, any 100 of 255 animals studied, any 100 optional missions, and all robberies, underwater discoveries, shooting ranges, drone races and Bret’s quests. Most side quests and many collectible types are not required at all, and most required ones only need 70–80% of their total. Do the optional missions as they appear — each one counts, and there are 200–300 of them.'],
    ['Step 3 — Strangers & Freaks and miscellaneous cleanup [about 10 hours]',
     'Most trophies will already be done after the checklist. Finish the 8 stranger strands that count (Kirk, Kyle, Yago, Pilot Pete and the rest), then sweep up whatever is left: the activity trophies, the money trophies and the odd one-offs like the UFO easter egg. Then Vice Got a Price! pops.'],
  ];
  for (const [title, body] of steps) {
    const s = el('section', 'step');
    s.append(el('h3', null, title));
    s.append(el('p', null, body));
    view.append(s);
  }
  const warn = el('div', 'warning');
  warn.append(el('h3', null, 'Before you start'));
  warn.append(el('p', null, 'Cheats disable trophies and saving for the session, so leave them off. There is no mission replay, so keep chapter-start and chapter-end saves. One trophy is possibly missable — Positive Mental Attitude, the Chapter 1 meditation — and it is covered in full on the Missables page. Everything else, including every stranger chain and every quest-giver, is still available in free-roam after the story.'));
  view.append(warn);
  view.append(el('h3', null, 'What the 100% checklist actually wants'));
  const table = el('table', 'checklist');
  const head = document.createElement('tr');
  for (const h of ['Task', 'Needed', 'Notes']) head.append(el('th', null, h));
  table.append(head);
  const rows = [
    ['Challenges', 'Any 70 of 80', 'Skip the hardest 10.'],
    ['Stunts', '300', 'Any mix of the 397: jumps, under-bridges, knife flights, base jumps.'],
    ['Vehicles scanned', '200 of 277', 'Base models only; boats and aircraft help too.'],
    ['Animals studied', '100 of 255', 'Binoculars; every dog and cat breed counts separately.'],
    ['Optional missions', 'Any 100', 'Purple icons and black icons with pink letters.'],
    ['Meditations', '15 of 18', 'With both characters counting +2 per spot.'],
    ['Robberies', 'All', 'Bank vaults, Payday Loans, jewelry, armored trucks.'],
    ['Underwater discoveries', 'All', 'Shipwrecks and treasures.'],
    ['Shooting ranges', 'All 42 golds', 'Also needed for The Shootist.'],
    ['Drone races', 'All 14 locations', 'Also needed for Top Fun.'],
    ['Bret’s quests', 'All 15 target decks', 'Also needed for Fair Game.'],
  ];
  for (const [a, b, c] of rows) {
    const tr = document.createElement('tr');
    tr.append(el('td', null, a), el('td', null, b), el('td', null, c));
    table.append(tr);
  }
  view.append(table);
}

// ---------- missables ----------
function renderMissables() {
  view.replaceChildren();
  view.append(el('h2', null, 'Missables — the one to watch'));
  view.append(el('p', null, 'Of the 55 trophies, only one is reported as possibly missable, by both PowerPyx and GTABase. Everything else can be done in free-roam after the story.'));
  const t = byId.get(28);
  const card = el('article', 'detail');
  card.append(el('h2', null, t.name));
  card.append(el('p', 'trophy-desc', `“${t.description}”`));
  card.append(tagsFor(t));
  card.append(el('p', 'guide-text', t.guide));
  card.append(sourceList(t));
  const link = el('a', 'guide-link', 'Open the full guide →');
  link.href = '#/guide/28';
  card.append(link);
  view.append(card);
  const ok = el('div', 'warning');
  ok.append(el('h3', null, 'What is not missable'));
  ok.append(el('p', null, 'Optional missions disappear after a while, some quest-givers go quiet mid-story (Kenton, for one), some fences close for good, and a few magazine collectibles sit in buildings that later lock — none of that touches any trophy. All trophy-related quest-givers come back after the story, stranger strands stay open in free-roam, and there are far more than 100 optional missions for the checklist’s 100. Time-sensitive quests with an hourglass icon fail on their own, but they are not needed for any trophy. One note from TechWiser: some stranger chains have windows tied to story progress, so start a stranger strand when it appears rather than leaving it for the end.'));
  view.append(ok);
}

// ---------- save ----------
function download(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = name;
  a.click();
}
function renderSave() {
  view.replaceChildren();
  view.append(el('h2', null, 'Save & settings'));
  view.append(el('p', null, 'Your progress and notes live in this browser only. Export them to keep a backup, or to move them to another device; import brings them back.'));
  const grid = el('div', 'savegrid');
  const exp = el('div', 'card');
  exp.append(el('h3', null, 'Export'));
  exp.append(el('p', null, `${earned.size} trophies earned · ${Object.keys(notes).filter(k => notes[k].trim()).length} notes written.`));
  const b1 = el('button', 'btn primary', 'Export progress + notes');
  b1.addEventListener('click', () => download('leonida-ledger-progress.json', JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned].sort((a, b) => a - b), notes }, null, 2)));
  exp.append(b1);
  grid.append(exp);
  const imp = el('div', 'card');
  imp.append(el('h3', null, 'Import'));
  imp.append(el('p', null, 'Import a file exported from this guide. It replaces the progress and notes in this browser.'));
  const label = el('label', 'import', 'Choose a progress file ');
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'application/json';
  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const ids = new Set((Array.isArray(data) ? data : data.earned ?? []).filter(n => byId.has(n)));
      earned = ids;
      notes = data.notes && typeof data.notes === 'object' ? data.notes : {};
      save(); renderHeader(); render();
    } catch { alert('That file could not be read as a Leonida Ledger export.'); }
  });
  label.append(input);
  imp.append(label);
  grid.append(imp);
  const reset = el('div', 'card');
  reset.append(el('h3', null, 'Start over'));
  reset.append(el('p', null, 'Clears every tick and note in this browser. Export first if you want a backup.'));
  const b2 = el('button', 'btn', 'Reset everything');
  b2.addEventListener('click', () => {
    if (confirm('Clear all progress and notes?')) { earned = new Set(); notes = {}; save(); renderHeader(); render(); }
  });
  reset.append(b2);
  grid.append(reset);
  const about = el('div', 'card');
  about.append(el('h3', null, 'About this guide'));
  about.append(el('p', null, 'Leonida Ledger covers the official 55-trophy PS5 list (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden). Guides are our own words, each citing its sources; unconfirmed details are labelled as such. No Rockstar logo or official artwork appears in this app, and it reaches for no network.'));
  grid.append(about);
  view.append(grid);
}

// ---------- routing ----------
function render() {
  const hash = location.hash || '#/tracker';
  const parts = hash.replace(/^#\//, '').split('/');
  const route = parts[0] || 'tracker';
  for (const b of document.querySelectorAll('.tabs button[data-route]')) {
    b.classList.toggle('active', b.dataset.route === route || (route === 'guide' && b.dataset.route === 'tracker'));
  }
  if (route === 'guide') renderGuide(Number(parts[1]));
  else if (route === 'roadmap') renderRoadmap();
  else if (route === 'missables') renderMissables();
  else if (route === 'save') renderSave();
  else renderTracker();
}

document.getElementById('spoilerToggle').checked = spoilers;
document.getElementById('spoilerToggle').addEventListener('change', e => {
  spoilers = e.target.checked; save(); render();
});
document.getElementById('themeToggle').checked = theme === 'night';
document.documentElement.dataset.theme = theme;
document.getElementById('themeToggle').addEventListener('change', e => {
  theme = e.target.checked ? 'night' : 'paper';
  document.documentElement.dataset.theme = theme;
  save();
});
for (const b of document.querySelectorAll('.tabs button[data-route]')) {
  b.addEventListener('click', () => { location.hash = `#/${b.dataset.route}`; });
}
window.addEventListener('hashchange', render);
renderHeader();
render();
