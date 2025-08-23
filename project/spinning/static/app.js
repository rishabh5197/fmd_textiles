
/**
 * Index page interactions for "Create Action" tile with draft persistence.
 * - Stores a draft in sessionStorage so Back won't lose entries.
 * - Auto-restores draft and opens modal when returning to index.
 */
const USE_MODAL = true;
const DRAFT_KEY = "spinning:quickadd:draft";   // sessionStorage key

(function(){
  const createTile = document.getElementById('tileCreate');
  if (!createTile) return;

  const addUrl = createTile.getAttribute('href') || '#';

  // Clear draft if server told us so (?cleardraft=1 after DB save)
  const params = new URLSearchParams(location.search);
  if (params.get('cleardraft') === '1') {
    clearDraft();
  }

  // Auto-open modal and restore draft if present
  const draft = loadDraft();
  if (USE_MODAL && draft && draft.rows && draft.rows.length) {
    openQuickAddModal(addUrl, { restore: draft });
  }

  if (!USE_MODAL) return;

  // Intercept click to open modal
  createTile.addEventListener('click', (e) => {
    e.preventDefault();
    openQuickAddModal(addUrl, { restore: draft });
  });

  // ————————————————————————————————————————————————
  // Modal
  // ————————————————————————————————————————————————
  function openQuickAddModal(targetUrl, { restore = null } = {}){
    let backdrop = document.getElementById('quickAddBackdrop');

    if (!backdrop) {
      injectModalTweaks();

      backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop';
      backdrop.id = 'quickAddBackdrop';
      backdrop.setAttribute('role', 'presentation');

      backdrop.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="qa-title">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
            <h3 id="qa-title" style="margin:4px 0 10px;">Quick add: Fabric & Bales</h3>
            <button class="close-x" type="button" aria-label="Close">×</button>
          </div>

          <!-- Two-column body -->
          <div class="qa-body">
            <!-- Left: form/repeater -->
            <div class="qa-left">
              <div id="qa-repeater" class="repeater" aria-live="polite"></div>

              <div class="actions">
                <button id="qa-add-row" class="btn" type="button">+ Add another</button>
                <div class="total">
                  <span class="muted">Total bales:</span>
                  <strong id="qa-total">0</strong>
                </div>
              </div>
            </div>

            <!-- Right: live review table -->
            <aside class="qa-right">
              <h4 class="qa-right-title">Review</h4>
              <div class="qa-table-wrap">
                <table class="qa-table" aria-label="Entries review">
                  <thead>
                    <tr>
                      <th style="width:44px;">#</th>
                      <th>Fabric</th>
                      <th style="width:120px;">Bales</th>
                      <th style="width:112px;">Actions</th>
                    </tr>
                  </thead>
                  <tbody id="qa-table-body"></tbody>
                </table>
              </div>
            </aside>
          </div>

          <!-- Footer buttons -->
          <div class="row">
            <button id="qa-continue" class="btn" type="button">Continue</button>
            <button id="qa-cancel" class="btn ghost" type="button">Cancel</button>
          </div>
        </div>
      `;
      document.body.appendChild(backdrop);

      // Wiring
      const repeater  = backdrop.querySelector('#qa-repeater');
      const tableBody = backdrop.querySelector('#qa-table-body');

      // Initialize rows (from restore or empty)
      if (restore && restore.rows && restore.rows.length) {
        restore.rows.forEach((r, i) => {
          repeater.insertAdjacentHTML('beforeend', rowHTML(i));
          const sel = repeater.querySelector(`.rep-row[data-index="${i}"] select`);
          const inp = repeater.querySelector(`.rep-row[data-index="${i}"] input[type="number"]`);
          if (sel) sel.value = r.fabric || '';
          if (inp) inp.value = r.bales ?? '';
        });
      } else {
        repeater.insertAdjacentHTML('beforeend', rowHTML(0));
      }

      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeModal();
      });
      backdrop.querySelector('.close-x').addEventListener('click', closeModal);
      backdrop.querySelector('#qa-cancel').addEventListener('click', closeModal);

      // Add row
      backdrop.querySelector('#qa-add-row').addEventListener('click', () => {
        const next = repeater.querySelectorAll('.rep-row').length;
        repeater.insertAdjacentHTML('beforeend', rowHTML(next));
        updateTotal(repeater); renderTable(repeater, tableBody);
        repeater.scrollTop = repeater.scrollHeight;
        repeater.querySelector(`.rep-row[data-index="${next}"] select`)?.focus();
        persistDraftFromDOM(repeater); // keep draft fresh
      });

      // Remove row (left pane)
      repeater.addEventListener('click', (e) => {
        const btn = e.target.closest('.remove-row');
        if (!btn) return;

        const rows = [...repeater.querySelectorAll('.rep-row')];
        if (rows.length === 1) {
          rows[0].querySelector('select').selectedIndex = 0;
          rows[0].querySelector('input[type="number"]').value = '';
        } else {
          btn.closest('.rep-row').remove();
          renumber(repeater);
        }
        updateTotal(repeater); renderTable(repeater, tableBody);
        persistDraftFromDOM(repeater);
      });

      // Live updates
      repeater.addEventListener('input', (e) => {
        if (!e.target.matches('select, input[type="number"]')) return;
        updateTotal(repeater); renderTable(repeater, tableBody);
        persistDraftFromDOM(repeater);
      });

      // Table actions
      tableBody.addEventListener('click', (e) => {
        const tr = e.target.closest('tr[data-index]');
        if (!tr) return;
        const idx = parseInt(tr.dataset.index, 10);
        if (Number.isNaN(idx)) return;

        if (e.target.closest('.qa-action-edit')) {
          focusRow(repeater, idx, { highlight: true });
        } else if (e.target.closest('.qa-action-delete')) {
          const rows = [...repeater.querySelectorAll('.rep-row')];
          if (rows.length === 1) {
            rows[0].querySelector('select').selectedIndex = 0;
            rows[0].querySelector('input[type="number"]').value = '';
          } else {
            rows[idx].remove();
            renumber(repeater);
          }
          updateTotal(repeater); renderTable(repeater, tableBody);
          persistDraftFromDOM(repeater);
        } else {
          focusRow(repeater, idx, { highlight: true });
        }
      });

      // Continue —> persist draft and redirect
      backdrop.querySelector('#qa-continue').addEventListener('click', () => {
        const rows = collectRows(repeater);
        saveDraft({ rows }); // persist so Back restores it

        // Build query params for the review page (optional but useful)
        const qp = new URLSearchParams();
        rows.forEach((r, i) => {
          if (r.fabric || r.bales !== '' && r.bales != null) {
            qp.set(`lines-${i}-type`, r.fabric || '');
            qp.set(`lines-${i}-bales`, r.bales === '' || r.bales == null ? '' : r.bales);
          }
        });
        qp.set('prefill', '1');

        const finalUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + qp.toString();
        window.location.assign(finalUrl);
      });
    }

    // Show & init
    backdrop.style.display = 'flex';
    const repeater = backdrop.querySelector('#qa-repeater');
    const tableBody = backdrop.querySelector('#qa-table-body');
    updateTotal(repeater); renderTable(repeater, tableBody);
    backdrop.querySelector('select')?.focus();
  }

  function closeModal(){
    const el = document.getElementById('quickAddBackdrop');
    if (el) el.style.display = 'none';
  }

  // ——— Persistence helpers ———
  function saveDraft(data){
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data || {})); } catch {}
  }
  function loadDraft(){
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
  function clearDraft(){
    try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
  }
  function persistDraftFromDOM(root){
    saveDraft({ rows: collectRows(root) });
  }
  function collectRows(root){
    const rows = [...root.querySelectorAll('.rep-row')];
    return rows.map(r => {
      const fabric = r.querySelector('select')?.value || '';
      const balesStr = r.querySelector('input[type="number"]')?.value ?? '';
      const bales = balesStr === '' ? '' : String(balesStr);
      return { fabric, bales };
    });
  }

  // ——— UI helpers ———
  function rowHTML(i){
    const opts = [
      '', 'Cotton','Polyester','Viscose','Linen','Wool','Acrylic','Nylon','Blends'
    ].map(v => v === ''
      ? '<option value="" disabled selected>Choose fabric…</option>'
      : `<option value="${v}">${v}</option>`
    ).join('');
    return `
      <div class="rep-row" data-index="${i}" style="margin-bottom:12px;">
        <div class="field">
          <label for="lines-${i}-type">Fabric</label>
          <select id="lines-${i}-type" name="lines-${i}-type" required>
            ${opts}
          </select>
          <span class="hint">Pick a fabric type</span>
        </div>

        <div class="field">
          <label for="lines-${i}-bales">Bales</label>
          <input id="lines-${i}-bales" name="lines-${i}-bales" type="number"
                 inputmode="numeric" min="0" step="1" required placeholder="0">
          <span class="hint">Enter count (whole number)</span>
        </div>

        <button class="btn ghost remove-row" type="button" aria-label="Remove row">Remove</button>
      </div>
    `;
  }
  function renumber(root){
    const rows = [...root.querySelectorAll('.rep-row')];
    rows.forEach((row, i) => {
      row.dataset.index = i;
      const sel  = row.querySelector('select');
      const inp  = row.querySelector('input[type="number"]');
      const lab1 = row.querySelector('label[for$="-type"]');
      const lab2 = row.querySelector('label[for$="-bales"]');
      sel.name = `lines-${i}-type`; sel.id = `lines-${i}-type`;
      inp.name = `lines-${i}-bales`; inp.id = `lines-${i}-bales`;
      if (lab1) lab1.setAttribute('for', sel.id);
      if (lab2) lab2.setAttribute('for', inp.id);
    });
  }
  function updateTotal(root){
    if (!root) return;
    const nums = [...root.querySelectorAll('input[type="number"]')];
    const total = nums.reduce((sum, el) => {
      const v = parseInt(el.value, 10);
      return sum + (Number.isFinite(v) ? v : 0);
    }, 0);
    const totalEl = document.getElementById('qa-total');
    if (totalEl) totalEl.textContent = total;
  }
  function focusRow(repeater, index, { highlight=false } = {}){
    const row = repeater.querySelector(`.rep-row[data-index="${index}"]`);
    if (!row) return;
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    row.querySelector('select')?.focus({ preventScroll: true });
    if (highlight) {
      row.classList.add('qa-focus');
      setTimeout(() => row.classList.remove('qa-focus'), 800);
    }
  }

  // Icons for table actions
  function iconPencil(){
    return `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12.3 6.3l5.4 5.4M14 4l6 6-9.8 9.8-4.6 1.2 1.2-4.6L14 4z"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
  }
  function iconTrash(){
    return `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`;
  }
  function renderTable(root, tableBody){
    if (!root || !tableBody) return;
    const rows = [...root.querySelectorAll('.rep-row')];
    const html = rows.map((row, i) => {
      const fabric = (row.querySelector('select')?.value || '').trim();
      const bales  = row.querySelector('input[type="number"]')?.value || '';
      return `
        <tr data-index="${i}" class="qa-table-row" tabindex="0" title="Click to focus row ${i+1}">
          <td>${i+1}</td>
          <td>${fabric || '<span class="muted">—</span>'}</td>
          <td>${bales !== '' ? bales : '<span class="muted">—</span>'}</td>
          <td class="qa-actions-cell">
            <button type="button" class="icon-btn qa-action-edit"   aria-label="Edit row ${i+1}" title="Edit">
              ${iconPencil()}
            </button>
            <button type="button" class="icon-btn danger qa-action-delete" aria-label="Delete row ${i+1}" title="Delete">
              ${iconTrash()}
            </button>
          </td>
        </tr>
      `;
    }).join('');
    tableBody.innerHTML = html || `
      <tr><td colspan="4" class="muted">No entries yet. Add rows on the left.</td></tr>
    `;
  }

  // Styling for independent scroll + wider modal/table
  function injectModalTweaks(){
    if (document.getElementById('qa-modal-tweaks')) return;
    const css = `
      .modal { max-width: 1040px; width: 96vw; max-height: 82vh;
               display:flex; flex-direction:column; }
      .qa-body { display:grid; grid-template-columns: 1.2fr 1fr; gap:16px;
                 flex: 1 1 auto; min-height:0; overflow:hidden; }
      @media (max-width: 980px){ .qa-body { grid-template-columns: 1fr; } }

      .qa-left { display:flex; flex-direction:column; min-height:0; overflow:hidden; }
      #qa-repeater { flex:1 1 auto; overflow:auto; padding-right:4px; margin-bottom:16px; }

      .rep-row { margin-bottom:12px; }
      .rep-row .remove-row { margin-top:4px; }
      .actions { margin-top:8px; margin-bottom:16px; padding-top:8px; border-top:1px solid rgba(14,165,233,.14); }

      .qa-right { background: var(--card); border:1px solid rgba(14,165,233,.18);
                  border-radius:12px; padding:12px; display:flex; flex-direction:column;
                  min-height:0; overflow:hidden; }
      .qa-right-title { margin:2px 0 8px; font-size:14px; color:var(--muted);
                        text-transform:uppercase; letter-spacing:.4px; }
      .qa-table-wrap { flex:1 1 auto; overflow:auto; }
      .qa-table { width:100%; border-collapse: collapse; }
      .qa-table th, .qa-table td { padding:10px; border-top:1px solid rgba(14,165,233,.14); text-align:left; }
      .qa-table thead th { font-size:12px; color:var(--muted); letter-spacing:.4px; text-transform:uppercase; border-top:none; }
      .qa-table tr:hover { background: rgba(14,165,233,.06); cursor: pointer; }
      .qa-actions-cell { display:flex; gap:8px; align-items:center; }

      .icon-btn { appearance:none; border:1px solid rgba(14,165,233,.28);
                  background: transparent; color: var(--text);
                  padding:6px; border-radius:10px; cursor:pointer;
                  display:inline-flex; align-items:center; justify-content:center;
                  transition: transform .08s ease, background .15s ease, border-color .15s ease; }
      .icon-btn:hover { background: rgba(14,165,233,.10); transform: translateY(-1px); }
      .icon-btn:active { transform: translateY(0) scale(.98); }
      .icon-btn.danger { border-color: rgba(239,68,68,.35); color: #fecaca; }
      .icon-btn.danger:hover { background: rgba(239,68,68,.12); }

      .qa-focus { outline: 2px solid var(--accent-2); border-radius:10px; transition: outline-color .2s; }
    `;
    const style = document.createElement('style');
    style.id = 'qa-modal-tweaks';
    style.innerHTML = css;
    document.head.appendChild(style);
  }
})();

