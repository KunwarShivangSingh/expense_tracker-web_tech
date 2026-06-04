// ============================================
//   SpendLog — Expense Tracker Logic
// ============================================

const DATA_KEY = 'spendlog_expenses';

const CAT_COLORS = {
  Food:          ['#E1F5EE', '#1D9E75', '#085041'],
  Transport:     ['#E6F1FB', '#378ADD', '#0C447C'],
  Bills:         ['#FAECE7', '#D85A30', '#712B13'],
  Shopping:      ['#FBEAF0', '#D4537E', '#72243E'],
  Health:        ['#EAF3DE', '#639922', '#27500A'],
  Entertainment: ['#FAEEDA', '#BA7517', '#633806'],
  Education:     ['#EEEDFE', '#7F77DD', '#3C3489'],
  Other:         ['#F1EFE8', '#888780', '#444441'],
};

// ── State ──────────────────────────────────
let expenses = [];
let filterCat = 'All';

// ── Storage ────────────────────────────────
function loadExpenses() {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (raw) {
      expenses = JSON.parse(raw);
    } else {
      // Seed with sample data on first load
      expenses = [
        {
          id: 1,
          amount: 2000,
          category: 'Food',
          description: 'Groceries',
          date: '2026-02-21 13:14',
        },
      ];
      saveExpenses();
    }
  } catch (e) {
    console.error('Failed to load expenses:', e);
    expenses = [];
  }
}

function saveExpenses() {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(expenses));
  } catch (e) {
    console.error('Failed to save expenses:', e);
  }
}

// ── Helpers ────────────────────────────────
function nextId() {
  return expenses.length ? Math.max(...expenses.map(e => e.id || 0)) + 1 : 1;
}

function fmtDate(d) {
  const dt = new Date(d.replace(' ', 'T'));
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtAmt(a) {
  return '₹' + Number(a).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function catStyle(cat) {
  const c = CAT_COLORS[cat] || CAT_COLORS.Other;
  return `background:${c[0]};color:${c[2]}`;
}

function barColor(cat) {
  return (CAT_COLORS[cat] || CAT_COLORS.Other)[1];
}

// ── Actions ────────────────────────────────
function addExpense() {
  const amt = parseFloat(document.getElementById('f-amount').value);
  if (!amt || amt <= 0) {
    showToast('Enter a valid amount');
    return;
  }

  const cat  = document.getElementById('f-cat').value;
  const desc = document.getElementById('f-desc').value.trim() || '—';
  const dateVal = document.getElementById('f-date').value;
  const date = dateVal
    ? dateVal + ' 00:00'
    : new Date().toISOString().slice(0, 16).replace('T', ' ');

  expenses.push({ id: nextId(), amount: amt, category: cat, description: desc, date });
  saveExpenses();
  render();

  document.getElementById('f-amount').value = '';
  document.getElementById('f-desc').value   = '';
  showToast('Expense added ✓');
}

function deleteExpense(id) {
  expenses = expenses.filter(e => e.id !== id);
  saveExpenses();
  render();
  showToast('Deleted');
}

function setFilter(cat) {
  filterCat = cat;
  renderFilters();
  renderList();
}

function getFiltered() {
  return filterCat === 'All' ? expenses : expenses.filter(e => e.category === filterCat);
}

// ── Tab Switching ──────────────────────────
function showTab(name, btn) {
  ['add', 'list', 'summary'].forEach(t => {
    document.getElementById('tab-' + t).style.display = t === name ? 'block' : 'none';
  });
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// ── Render ─────────────────────────────────
function render() {
  renderMetrics();
  renderFilters();
  renderList();
  renderSummary();
}

function renderMetrics() {
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const cats  = new Set(expenses.map(e => e.category)).size;
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthTotal = expenses
    .filter(e => e.date.startsWith(thisMonth))
    .reduce((s, e) => s + Number(e.amount), 0);
  const avg = expenses.length ? total / expenses.length : 0;

  document.getElementById('metrics').innerHTML = `
    <div class="metric">
      <div class="metric-label">Total Spent</div>
      <div class="metric-value total">${fmtAmt(total)}</div>
      <div class="metric-sub">${expenses.length} entr${expenses.length === 1 ? 'y' : 'ies'}</div>
    </div>
    <div class="metric">
      <div class="metric-label">This Month</div>
      <div class="metric-value month">${fmtAmt(monthTotal)}</div>
      <div class="metric-sub">${new Date().toLocaleString('en', { month: 'long' })}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Categories</div>
      <div class="metric-value cats">${cats}</div>
      <div class="metric-sub">unique</div>
    </div>
    <div class="metric">
      <div class="metric-label">Avg per Entry</div>
      <div class="metric-value avg">${fmtAmt(avg)}</div>
      <div class="metric-sub">across all</div>
    </div>
  `;
}

function renderFilters() {
  const cats = ['All', ...new Set(expenses.map(e => e.category))];
  document.getElementById('filter-row').innerHTML = cats
    .map(c => `<button class="filter-chip${c === filterCat ? ' active' : ''}" onclick="setFilter('${c}')">${c}</button>`)
    .join('');
}

function renderList() {
  const list = getFiltered().slice().reverse();

  if (!list.length) {
    document.getElementById('expense-list').innerHTML = `
      <div class="empty">
        <i class="ti ti-receipt-off" aria-hidden="true"></i>
        No expenses here yet
      </div>`;
    return;
  }

  document.getElementById('expense-list').innerHTML = list.map(e => `
    <div class="expense-row">
      <div class="exp-main">
        <div class="exp-desc">${e.description || '—'}</div>
        <div class="exp-date">${fmtDate(e.date)}</div>
      </div>
      <div>
        <span class="cat-badge" style="${catStyle(e.category)}">${e.category}</span>
      </div>
      <div class="exp-amount">${fmtAmt(e.amount)}</div>
      <button class="del-btn" onclick="deleteExpense(${e.id})" aria-label="Delete expense">
        <i class="ti ti-trash" aria-hidden="true"></i>
      </button>
    </div>
  `).join('');
}

function renderSummary() {
  if (!expenses.length) {
    document.getElementById('summary-content').innerHTML = `
      <div class="empty">
        <i class="ti ti-chart-bar" aria-hidden="true"></i>
        No data yet — add some expenses!
      </div>`;
    return;
  }

  const total  = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const byCat  = {};
  expenses.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount); });
  const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

  const rows = sorted.map(([cat, amt]) => {
    const pct = Math.round((amt / total) * 100);
    return `
      <div class="cat-row">
        <div class="cat-info">
          <div class="cat-name">${cat}</div>
          <div class="cat-bar-wrap">
            <div class="cat-bar" style="width:${pct}%;background:${barColor(cat)}"></div>
          </div>
        </div>
        <div class="cat-pct">${pct}%</div>
        <div class="cat-amt">${fmtAmt(amt)}</div>
      </div>`;
  }).join('');

  document.getElementById('summary-content').innerHTML = `
    <div class="metric-label">Total</div>
    <div class="summary-total">${fmtAmt(total)}</div>
    <div class="section-label">By Category</div>
    ${rows}
  `;
}

// ── Toast ──────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

// ── Init ───────────────────────────────────
document.getElementById('f-date').value = new Date().toISOString().slice(0, 10);
loadExpenses();
render();
