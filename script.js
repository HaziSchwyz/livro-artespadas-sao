const CATEGORY_ORDER = [
  ['Inata', 'Artespadas Inatas'],
  ['Adaga', 'Artespadas de Adaga'],
  ['Espada', 'Artespadas de Espada'],
  ['Espada Pesada', 'Artespadas de Espada Pesada'],
  ['Machado', 'Artespadas de Machado'],
  ['Contundente', 'Artespadas Contundentes'],
  ['Haste', 'Artespadas de Haste'],
  ['Escudo', 'Artespadas de Escudo'],
  ['Punhos', 'Artespadas de Punhos']
];

const FIELD_DEFINITIONS = [
  ['ID', 'Identificador único da Artespada.'],
  ['Categoria', 'Grupo ou arma ao qual a Artespada pertence.'],
  ['Classe', 'Classe registrada na base de dados.'],
  ['Rank', 'Rank requerido registrado na base de dados.'],
  ['Pré', 'Preparação registrada no campo preparacao.'],
  ['TC', 'Tempo registrado no campo tc.'],
  ['Pós', 'Condição registrada no campo pos.'],
  ['Custo', 'Custo registrado no campo custo.'],
  ['Dano', 'Dano registrado no campo dano.'],
  ['Crítico', 'Valor registrado no campo critico.'],
  ['Alcance', 'Alcance registrado no campo alcance.'],
  ['Tipo', 'Tipo registrado no campo tipo.']
];

const EMPTY_EFFECT_TEXT = 'Não informado na base fornecida.';
const state = { artespadas: [], filtered: [], categories: [] };

const $ = (selector) => document.querySelector(selector);
const unique = (items) => [...new Set(items.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
const toFocus = (value) => value && !['-', '—'].includes(value) ? `${value} Foco` : value || '—';
const isPenalty = (value) => String(value || '').includes('-');

function escapeHtml(value) {
  return String(value || '—')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

// Fetch works online. XHR/iframe help when index.html is opened locally.
async function loadJson(path) {
  try {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    try { return await loadJsonWithXhr(path); }
    catch (xhrError) { return loadJsonWithIframe(path, xhrError); }
  }
}

function loadJsonWithXhr(path) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.overrideMimeType('application/json');
    request.open('GET', path, true);
    request.onload = () => {
      if (request.status === 0 || (request.status >= 200 && request.status < 300)) {
        try { resolve(JSON.parse(request.responseText)); }
        catch (parseError) { reject(parseError); }
      } else reject(new Error(`XHR ${request.status}`));
    };
    request.onerror = () => reject(new Error('XHR blocked'));
    request.send();
  });
}

function loadJsonWithIframe(path, previousError) {
  return new Promise((resolve, reject) => {
    const frame = document.createElement('iframe');
    frame.hidden = true;
    frame.src = path;
    frame.onload = () => {
      try {
        const text = frame.contentDocument.body.textContent;
        frame.remove();
        resolve(JSON.parse(text));
      } catch (error) {
        frame.remove();
        reject(previousError || error);
      }
    };
    frame.onerror = () => {
      frame.remove();
      reject(previousError || new Error('Iframe JSON load blocked'));
    };
    document.body.appendChild(frame);
  });
}

function byBookOrder(a, b) {
  const ca = categorySortIndex(a.categoria);
  const cb = categorySortIndex(b.categoria);
  return (ca - cb)
    || a.categoria.localeCompare(b.categoria, 'pt-BR')
    || (Number(a.rank || 0) - Number(b.rank || 0))
    || a.nome.localeCompare(b.nome, 'pt-BR');
}

function categorySortIndex(categoryName) {
  const officialIndex = CATEGORY_ORDER.findIndex(([category]) => category === categoryName);
  return officialIndex >= 0 ? officialIndex : CATEGORY_ORDER.length;
}

function categoryTitle(categoryName) {
  const official = CATEGORY_ORDER.find(([category]) => category === categoryName);
  return official ? official[1] : categoryName;
}

function detectCategories() {
  const found = unique(state.artespadas.map((art) => art.categoria));
  const official = CATEGORY_ORDER
    .map(([category]) => category)
    .filter((category) => found.includes(category));
  const extras = found
    .filter((category) => !CATEGORY_ORDER.some(([officialCategory]) => officialCategory === category))
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  state.categories = [...official, ...extras];
}

function hasMechanicalEffect(art) {
  const value = art.efeito;
  if (value === undefined || value === null) return false;
  const normalized = String(value).trim();
  return normalized !== '' && normalized !== EMPTY_EFFECT_TEXT;
}

function optionList(values, firstLabel) {
  return `<option value="">${firstLabel}</option>` + values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');
}

function setupActions() {
  $('#printButton')?.addEventListener('click', () => window.print());
  $('#pdfButton')?.addEventListener('click', () => window.print());
}

function setupFilters() {
  $('#categoryFilter').innerHTML = optionList(unique(state.artespadas.map((a) => a.categoria)), 'Todas');
  $('#rankFilter').innerHTML = optionList(unique(state.artespadas.map((a) => `Rank ${a.rank} · ${a.classe}`)), 'Todos');
  $('#typeFilter').innerHTML = optionList(unique(state.artespadas.flatMap((a) => a.tipo.split('/').map((t) => t.trim()))), 'Todos');

  ['#searchInput', '#categoryFilter', '#rankFilter', '#typeFilter'].forEach((selector) => {
    $(selector).addEventListener('input', applyFilters);
    $(selector).addEventListener('change', applyFilters);
  });
  $('#clearFilters').addEventListener('click', clearFilters);
}

function applyFilters() {
  const query = $('#searchInput').value.trim().toLowerCase();
  const category = $('#categoryFilter').value;
  const rankClass = $('#rankFilter').value;
  const type = $('#typeFilter').value;

  state.filtered = state.artespadas.filter((art) => {
    const rankLabel = `Rank ${art.rank} · ${art.classe}`;
    return (!query || art.nome.toLowerCase().includes(query))
      && (!category || art.categoria === category)
      && (!rankClass || rankLabel === rankClass)
      && (!type || art.tipo.split('/').map((t) => t.trim()).includes(type));
  });

  renderChapters();
  renderResultCount();
}

function clearFilters() {
  $('#searchInput').value = '';
  $('#categoryFilter').value = '';
  $('#rankFilter').value = '';
  $('#typeFilter').value = '';
  applyFilters();
}

function renderStats() {
  $('#totalArtespadas').textContent = state.artespadas.length;
  $('#totalCategorias').textContent = unique(state.artespadas.map((a) => a.categoria)).length;
  $('#totalRanks').textContent = unique(state.artespadas.map((a) => a.rank)).length;
  $('#totalTipos').textContent = unique(state.artespadas.flatMap((a) => a.tipo.split('/').map((t) => t.trim()))).length;
}

function renderDefinitions() {
  $('#definitionGrid').innerHTML = FIELD_DEFINITIONS.map(([term, text]) => `<article><h3>${term}</h3><p>${text}</p></article>`).join('');
}

function renderToc() {
  const chapterLinks = state.categories.map((category) => {
    const title = categoryTitle(category);
    return `<a href="#${slugify(title)}"><span>${escapeHtml(title)}</span><small>${countBy('categoria', category)}</small></a>`;
  }).join('');
  $('#tocLinks').innerHTML = `
    <a href="#intro"><span>Introdução ao Sistema de Artespadas</span></a>
    <a href="#filtros"><span>Busca e Filtros</span></a>
    ${chapterLinks}
    <a href="#indice-nome"><span>Índice por Nome</span></a>
    <a href="#indice-categoria"><span>Índice por Categoria</span></a>
    <a href="#indice-rank"><span>Índice por Rank</span></a>
    <a href="#indice-tipo"><span>Índice por Tipo</span></a>
  `;
}

function countBy(field, value) {
  return state.artespadas.filter((art) => art[field] === value).length;
}

function renderResultCount() {
  $('#resultCount').textContent = `${state.filtered.length} de ${state.artespadas.length} Artespadas exibidas`;
}

function categoryStats(items) {
  const ranks = unique(items.map((a) => a.rank)).join(', ') || '—';
  const types = unique(items.flatMap((a) => a.tipo.split('/').map((t) => t.trim())));
  const costs = unique(items.map((a) => toFocus(a.custo)));
  return `
    <div class="category-stats">
      <div class="category-stat"><b>${items.length}</b><span>Artespadas</span></div>
      <div class="category-stat"><b>${escapeHtml(ranks)}</b><span>Ranks</span></div>
      <div class="category-stat"><b>${types.length}</b><span>Tipos</span></div>
      <div class="category-stat"><b>${escapeHtml(costs.join(', '))}</b><span>Custos</span></div>
    </div>
  `;
}

function renderChapters() {
  $('#chapters').innerHTML = state.categories.map((category) => {
    const title = categoryTitle(category);
    const items = state.filtered.filter((art) => art.categoria === category);
    return `
      <section class="chapter ${items.length ? '' : 'hidden'}" id="${slugify(title)}">
        <div class="chapter-header">
          <div><p class="kicker">Categoria</p><h2>${escapeHtml(title)}</h2></div>
          <small>${items.length} registros</small>
        </div>
        ${categoryStats(items)}
        <div class="card-list">${items.map(renderCard).join('')}</div>
      </section>
    `;
  }).join('');
}

function renderCard(art) {
  const anchor = art.anchor || slugify(art.id);
  const index = state.artespadas.findIndex((item) => item.id === art.id);
  const previous = state.artespadas[index - 1];
  const next = state.artespadas[index + 1];
  return `
    <article class="sword-card" id="${escapeHtml(anchor)}">
      <div class="card-title-row">
        <div>
          <p class="card-id">${escapeHtml(art.id)}</p>
          <h3>${escapeHtml(art.nome)}</h3>
        </div>
        <span class="rank-badge">Rank ${escapeHtml(art.rank)}</span>
      </div>

      <div class="meta-strip">
        ${meta('Categoria', art.categoria)}
        ${meta('Classe', art.classe)}
        ${meta('Raridade', art.raridade)}
        ${meta('Status', art.status)}
      </div>

      <div class="card-body">
        <div class="info-block prep-column">
          <h4>Preparação</h4>
          <div class="prep-grid">
            ${stat('Pré', art.preparacao)}
            ${stat('TC', art.tc)}
            ${stat('Pós', art.pos, isPenalty(art.pos))}
          </div>
        </div>

        <div class="info-block combat-column">
          <h4>Combate</h4>
          <div class="combat-grid">
            ${stat('Custo', toFocus(art.custo), false, true)}
            ${stat('Dano', art.dano, false, true)}
            ${stat('Crítico', art.critico, isPenalty(art.critico))}
            ${stat('Alcance', art.alcance, false, true)}
            ${stat('Tipo', art.tipo, false, true)}
          </div>
        </div>

        <div class="info-block text-column">
          <div class="text-block narrative"><h4>Descrição Narrativa</h4><p>${escapeHtml(art.descricao)}</p></div>
          ${renderEffectBlock(art)}
          <div class="text-block notes"><h4>Observações</h4><p>${escapeHtml(art.observacoes)}</p></div>
        </div>
      </div>

      <nav class="card-nav no-print" aria-label="Navegação entre Artespadas">
        ${navLink(previous, '← Anterior')}
        ${navLink(next, 'Próxima →', 'next')}
      </nav>
    </article>
  `;
}

function renderEffectBlock(art) {
  if (!hasMechanicalEffect(art)) {
    return '<div class="text-block mechanic muted-effect"><h4>Efeito Mecânico</h4><p aria-label="Efeito mecânico não informado">—</p></div>';
  }
  return `<div class="text-block mechanic"><h4>Efeito Mecânico</h4><p>${escapeHtml(art.efeito)}</p></div>`;
}

function navLink(art, label, extraClass = '') {
  if (!art) return `<span class="nav-link ${extraClass}" aria-disabled="true">${label}<small>—</small></span>`;
  return `<a class="nav-link ${extraClass}" href="#${escapeHtml(art.anchor || slugify(art.id))}"><span>${label}</span><small>${escapeHtml(art.nome)}</small></a>`;
}

function meta(label, value) {
  return `<span class="meta-pill"><span class="label">${label}</span><span class="value">${escapeHtml(value)}</span></span>`;
}

function stat(label, value, penalty = false, highlight = false) {
  const classes = ['stat-box'];
  if (highlight) classes.push('highlight');
  return `<div class="${classes.join(' ')}"><span class="label">${label}</span><span class="value ${penalty ? 'penalty' : ''}">${escapeHtml(value)}</span></div>`;
}

function renderIndexes() {
  $('#nameIndex').innerHTML = [...state.artespadas]
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .map((art) => indexLink(art, `${art.categoria} · Rank ${art.rank}`))
    .join('');

  $('#categoryIndex').innerHTML = state.categories.map((category) => (
    `<a href="#${slugify(categoryTitle(category))}"><span>${escapeHtml(categoryTitle(category))}</span><small>${countBy('categoria', category)} Artespadas</small></a>`
  )).join('');

  renderGroupedIndex('#rankIndex', groupBy(state.artespadas, (art) => `Rank ${art.rank}`));
  renderGroupedIndex('#typeIndex', groupByTypes());
}

function indexLink(art, detail) {
  return `<a href="#${escapeHtml(art.anchor || slugify(art.id))}"><span>${escapeHtml(art.nome)}</span><small>${escapeHtml(detail)}</small></a>`;
}

function groupBy(items, getKey) {
  return items.reduce((groups, item) => {
    const key = getKey(item);
    groups[key] = groups[key] || [];
    groups[key].push(item);
    return groups;
  }, {});
}

function groupByTypes() {
  return state.artespadas.reduce((groups, art) => {
    art.tipo.split('/').map((type) => type.trim()).filter(Boolean).forEach((type) => {
      groups[type] = groups[type] || [];
      groups[type].push(art);
    });
    return groups;
  }, {});
}

function renderGroupedIndex(selector, groups) {
  const orderedKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
  $(selector).innerHTML = orderedKeys.map((key) => `
    <div>
      <h3>${escapeHtml(key)}</h3>
      ${groups[key].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map((art) => indexLink(art, `${art.categoria} · Rank ${art.rank}`)).join('')}
    </div>
  `).join('');
}

async function init() {
  try {
    state.artespadas = (await loadJson('artespadas.json')).sort(byBookOrder);
    detectCategories();
    state.filtered = [...state.artespadas];
    setupActions();
    renderStats();
    renderDefinitions();
    renderToc();
    setupFilters();
    renderChapters();
    renderIndexes();
    renderResultCount();
  } catch (error) {
    $('#resultCount').textContent = 'Não foi possível carregar artespadas.json.';
    console.error(error);
  }
}

init();
