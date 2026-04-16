// ================================================
// StyleLoop Admin - Common Utilities JS
// ================================================

// ---- TOAST NOTIFICATIONS ----
const Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 4000) {
    this.init();
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
      <span class="toast-message">${message}</span>
      <button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;font-size:16px;color:var(--text-muted);margin-right:auto;">×</button>
    `;
    this.container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  },

  success(msg)  { this.show(msg, 'success'); },
  error(msg)    { this.show(msg, 'error');   },
  warning(msg)  { this.show(msg, 'warning'); },
  info(msg)     { this.show(msg, 'info');    }
};

// ---- MODAL SYSTEM ----
const Modal = {
  open(id) {
    const overlay = document.getElementById(id);
    if (overlay) {
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  },

  close(id) {
    const overlay = document.getElementById(id);
    if (overlay) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  },

  closeAll() {
    document.querySelectorAll('.modal-overlay.open').forEach(m => {
      m.classList.remove('open');
    });
    document.body.style.overflow = '';
  }
};

// Close modal on overlay click
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) {
    Modal.closeAll();
  }
});

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') Modal.closeAll();
});

// ---- CONFIRMATION DIALOG ----
function showConfirm(message, onConfirm, onCancel) {
  let overlay = document.getElementById('confirmDialogOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'confirmDialogOverlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal modal-sm confirm-dialog">
        <div class="modal-header">
          <span class="modal-title">⚠️ تأكيد العملية</span>
        </div>
        <div class="modal-body">
          <p id="confirmMessage" style="font-size:14px;color:var(--text-primary);line-height:1.6;"></p>
        </div>
        <div class="modal-footer">
          <button id="confirmOkBtn" class="btn btn-danger">تأكيد</button>
          <button id="confirmCancelBtn" class="btn btn-secondary">إلغاء</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }
  document.getElementById('confirmMessage').textContent = message;
  overlay.classList.add('open');

  document.getElementById('confirmOkBtn').onclick = function() {
    overlay.classList.remove('open');
    if (onConfirm) onConfirm();
  };
  document.getElementById('confirmCancelBtn').onclick = function() {
    overlay.classList.remove('open');
    if (onCancel) onCancel();
  };
}

// ---- FORM VALIDATION ----
const FormValidator = {
  rules: {
    required: (val) => val.trim() !== '' || 'هذا الحقل مطلوب',
    email: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'البريد الإلكتروني غير صحيح',
    phone: (val) => /^[\d\s\+\-\(\)]{8,15}$/.test(val) || 'رقم الهاتف غير صحيح',
    minLen: (min) => (val) => val.length >= min || `يجب أن يكون ${min} حروف على الأقل`,
    maxLen: (max) => (val) => val.length <= max || `يجب أن لا يتجاوز ${max} حرفاً`,
    number: (val) => !isNaN(parseFloat(val)) || 'يجب أن يكون رقماً',
    positive: (val) => parseFloat(val) > 0 || 'يجب أن يكون رقماً موجباً',
  },

  validateField(input, rules) {
    const val = input.value || '';
    for (const rule of rules) {
      const result = typeof rule === 'function' ? rule(val) : this.rules[rule]?.(val);
      if (result !== true) {
        this.showError(input, result || 'خطأ في الحقل');
        return false;
      }
    }
    this.clearError(input);
    return true;
  },

  showError(input, msg) {
    input.classList.add('error');
    let errEl = input.nextElementSibling;
    if (!errEl || !errEl.classList.contains('form-error')) {
      errEl = document.createElement('div');
      errEl.className = 'form-error';
      input.parentNode.insertBefore(errEl, input.nextSibling);
    }
    errEl.textContent = '⚠ ' + msg;
  },

  clearError(input) {
    input.classList.remove('error');
    const errEl = input.nextElementSibling;
    if (errEl && errEl.classList.contains('form-error')) errEl.remove();
  },

  validateForm(formEl) {
    let valid = true;
    formEl.querySelectorAll('[data-validate]').forEach(input => {
      const rules = input.getAttribute('data-validate').split(',');
      if (!this.validateField(input, rules)) valid = false;
    });
    return valid;
  }
};

// ---- TABLE SORTING ----
function initTableSort(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;
  table.querySelectorAll('thead th[data-sort]').forEach(th => {
    th.addEventListener('click', function() {
      const col = this.getAttribute('data-sort');
      const currentDir = this.classList.contains('asc') ? 'desc' : 'asc';
      table.querySelectorAll('thead th').forEach(h => {
        h.classList.remove('asc', 'desc', 'sorted');
        const icon = h.querySelector('.sort-icon');
        if (icon) icon.textContent = '↕';
      });
      this.classList.add('sorted', currentDir);
      const icon = this.querySelector('.sort-icon');
      if (icon) icon.textContent = currentDir === 'asc' ? '↑' : '↓';

      const tbody = table.querySelector('tbody');
      const rows = Array.from(tbody.querySelectorAll('tr'));
      rows.sort((a, b) => {
        const aCell = a.querySelector(`td[data-col="${col}"]`) || a.cells[parseInt(col)] || a.cells[0];
        const bCell = b.querySelector(`td[data-col="${col}"]`) || b.cells[parseInt(col)] || b.cells[0];
        const aVal = aCell ? aCell.textContent.trim() : '';
        const bVal = bCell ? bCell.textContent.trim() : '';
        const aNum = parseFloat(aVal.replace(/[^\d.]/g, ''));
        const bNum = parseFloat(bVal.replace(/[^\d.]/g, ''));
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return currentDir === 'asc' ? aNum - bNum : bNum - aNum;
        }
        return currentDir === 'asc' ? aVal.localeCompare(bVal, 'ar') : bVal.localeCompare(aVal, 'ar');
      });
      rows.forEach(r => tbody.appendChild(r));
    });
  });
}

// ---- SEARCH/FILTER TABLE ----
function filterTable(inputId, tableId, colIndexes) {
  const input = document.getElementById(inputId);
  const table = document.getElementById(tableId);
  if (!input || !table) return;
  input.addEventListener('input', function() {
    const q = this.value.toLowerCase();
    table.querySelectorAll('tbody tr').forEach(row => {
      const cells = colIndexes ? colIndexes.map(i => row.cells[i]) : Array.from(row.cells);
      const text = cells.map(c => c ? c.textContent.toLowerCase() : '').join(' ');
      row.style.display = text.includes(q) ? '' : 'none';
    });
  });
}

// ---- LOADING STATE ----
const Loader = {
  overlay: null,

  show(msg = 'جاري التحميل...') {
    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.className = 'loading-overlay';
      this.overlay.innerHTML = `
        <div class="spinner spinner-lg"></div>
        <div class="loading-text">${msg}</div>
      `;
      document.body.appendChild(this.overlay);
    } else {
      this.overlay.querySelector('.loading-text').textContent = msg;
      this.overlay.style.display = 'flex';
    }
  },

  hide() {
    if (this.overlay) this.overlay.style.display = 'none';
  }
};

// ---- EXPORT TO CSV ----
function exportToCSV(data, filename = 'export.csv') {
  if (!data || !data.length) { Toast.warning('لا توجد بيانات للتصدير'); return; }
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','));
  const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  Toast.success('تم تصدير الملف بنجاح');
}

// Export table to CSV
function exportTableToCSV(tableId, filename = 'export.csv') {
  const table = document.getElementById(tableId);
  if (!table) return;
  const rows = [];
  table.querySelectorAll('tr').forEach(row => {
    const cells = Array.from(row.querySelectorAll('th, td'))
      .filter(c => !c.querySelector('.table-actions'))
      .map(c => `"${c.textContent.trim().replace(/"/g, '""')}"`);
    if (cells.length) rows.push(cells.join(','));
  });
  const csv = '\uFEFF' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  Toast.success('تم تصدير الملف بنجاح');
}

// ---- PRINT ----
function printPage() {
  window.print();
}

function printElement(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const win = window.open('', '_blank');
  win.document.write(`
    <html lang="ar" dir="rtl">
    <head>
      <title>طباعة - StyleLoop</title>
      <link rel="stylesheet" href="admin-styles.css">
      <style>body{padding:20px;font-family:'Cairo',sans-serif}</style>
    </head>
    <body>${el.innerHTML}</body>
    </html>
  `);
  win.document.close();
  setTimeout(() => { win.print(); win.close(); }, 500);
}

// ---- DATE FORMATTING ----
function formatDate(dateStr, locale = 'ar-SA') {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale, {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('ar-SA', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
}

function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'منذ لحظات';
  if (diff < 3600) return `منذ ${Math.floor(diff/60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff/3600)} ساعة`;
  if (diff < 2592000) return `منذ ${Math.floor(diff/86400)} يوم`;
  return formatDate(dateStr);
}

// ---- NUMBER FORMATTING ----
function formatCurrency(amount, currency = 'SAR') {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency', currency,
    minimumFractionDigits: 0, maximumFractionDigits: 2
  }).format(amount);
}

function formatNumber(num) {
  return new Intl.NumberFormat('ar-SA').format(num);
}

// ---- CHART.JS HELPERS ----
const ChartHelper = {
  defaultColors: [
    '#E91E63', '#C9A96E', '#8FAE8B', '#3B82F6', '#F59E0B',
    '#10B981', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ],

  defaultOptions(title = '') {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { family: 'Cairo', size: 12 }, padding: 16, usePointStyle: true }
        },
        title: {
          display: !!title,
          text: title,
          font: { family: 'Cairo', size: 14, weight: '700' },
          color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#1F2937'
        },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              return ` ${ctx.dataset.label || ''}: ${formatNumber(ctx.parsed.y ?? ctx.parsed)}`;
            }
          }
        }
      },
      scales: {}
    };
  },

  createLineChart(canvasId, labels, datasets, options = {}) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const textColor = isDark ? '#94A3B8' : '#6B7280';

    return new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: datasets.map((d, i) => ({
          borderColor: d.color || this.defaultColors[i],
          backgroundColor: (d.color || this.defaultColors[i]) + '20',
          borderWidth: 2.5,
          pointBackgroundColor: d.color || this.defaultColors[i],
          pointRadius: 4,
          fill: d.fill !== false,
          tension: 0.4,
          ...d
        }))
      },
      options: {
        ...this.defaultOptions(options.title),
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { family: 'Cairo', size: 11 } }
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { family: 'Cairo', size: 11 } }
          }
        },
        ...options
      }
    });
  },

  createBarChart(canvasId, labels, datasets, options = {}) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const textColor = isDark ? '#94A3B8' : '#6B7280';

    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: datasets.map((d, i) => ({
          backgroundColor: d.color || this.defaultColors[i],
          borderRadius: 6,
          borderSkipped: false,
          ...d
        }))
      },
      options: {
        ...this.defaultOptions(options.title),
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { family: 'Cairo', size: 11 } }
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { family: 'Cairo', size: 11 } }
          }
        },
        ...options
      }
    });
  },

  createPieChart(canvasId, labels, data, options = {}) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;
    return new Chart(ctx, {
      type: options.doughnut ? 'doughnut' : 'pie',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: this.defaultColors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#1E2235' : '#FFFFFF'
        }]
      },
      options: {
        ...this.defaultOptions(options.title),
        cutout: options.doughnut ? '65%' : 0,
        ...options
      }
    });
  }
};

// ---- MOCK DATA GENERATORS ----
const MockData = {
  names: ['أحمد محمد', 'فاطمة علي', 'محمد سالم', 'نورة الأحمد', 'خالد العتيبي', 'ريم السعيد', 'عبدالله الغامدي', 'منى الشهري', 'سارة الزهراني', 'عمر الحربي'],
  products: ['فستان سهرة', 'عباءة فاخرة', 'بلوزة كاجوال', 'تنورة قصيرة', 'جاكيت جلد', 'حقيبة يد', 'حذاء كعب', 'شال حرير', 'عقد ذهبي', 'خاتم ألماس'],
  categories: ['فساتين', 'عبايات', 'بلوزات', 'تنانير', 'جاكيتات', 'اكسسوارات', 'أحذية', 'حقائب'],
  cities: ['الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'المدينة المنورة', 'الطائف', 'أبها', 'تبوك'],
  statuses: ['pending', 'processing', 'completed', 'cancelled'],
  statusLabels: { pending: 'معلق', processing: 'قيد التنفيذ', completed: 'مكتمل', cancelled: 'ملغي' },
  payments: ['cash', 'card', 'wallet'],
  paymentLabels: { cash: 'نقدي', card: 'بطاقة', wallet: 'محفظة' },

  randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  randomNum(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
  randomPrice() { return (Math.floor(Math.random() * 200 + 50) * 5); },
  randomDate(daysAgo = 30) {
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
    return d.toLocaleDateString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit' });
  },
  randomPhone() {
    return `05${this.randomNum(10,99)}${this.randomNum(100000,999999)}`;
  },
  randomEmail(name) {
    const slug = name.replace(/\s/g, '.').toLowerCase();
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    return `${slug}@${this.randomItem(domains)}`;
  },
  randomOrderId() {
    return 'SL-' + String(this.randomNum(10000, 99999));
  },

  generateOrders(count = 8) {
    return Array.from({length: count}, (_, i) => {
      const name = this.randomItem(this.names);
      const status = this.randomItem(this.statuses);
      const items = this.randomNum(1, 5);
      const total = items * this.randomPrice();
      return {
        id: this.randomOrderId(),
        customer: name,
        date: this.randomDate(30),
        items,
        total,
        status,
        statusLabel: this.statusLabels[status],
        payment: this.randomItem(this.payments),
        paymentLabel: this.paymentLabels[this.randomItem(this.payments)]
      };
    });
  },

  generateCustomers(count = 8) {
    return Array.from({length: count}, () => {
      const name = this.randomItem(this.names);
      const orders = this.randomNum(1, 20);
      return {
        name,
        phone: this.randomPhone(),
        email: this.randomEmail(name),
        city: this.randomItem(this.cities),
        orders,
        spent: orders * this.randomPrice() * 2,
        status: Math.random() > 0.2 ? 'active' : 'inactive',
        statusLabel: Math.random() > 0.2 ? 'نشط' : 'غير نشط',
        joinDate: this.randomDate(365)
      };
    });
  },

  generateProducts(count = 8) {
    return Array.from({length: count}, () => {
      const stockNum = this.randomNum(0, 50);
      const stock = stockNum === 0 ? 'out-of-stock' : stockNum < 5 ? 'low-stock' : 'in-stock';
      const stockLabel = { 'out-of-stock': 'نفد المخزون', 'low-stock': 'مخزون منخفض', 'in-stock': 'متوفر' };
      return {
        name: this.randomItem(this.products),
        category: this.randomItem(this.categories),
        price: this.randomPrice(),
        stock: stockNum,
        stockStatus: stock,
        stockLabel: stockLabel[stock],
        sales: this.randomNum(0, 100)
      };
    });
  },

  generateMonthlySales() {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return {
      labels: months,
      data: months.map(() => this.randomNum(5000, 35000))
    };
  }
};

// ---- BULK SELECT ----
function initBulkSelect(tableId, bulkBarId) {
  const table = document.getElementById(tableId);
  const bulkBar = document.getElementById(bulkBarId);
  if (!table || !bulkBar) return;

  const masterCb = table.querySelector('thead input[type="checkbox"]');
  const updateBulkBar = () => {
    const checked = table.querySelectorAll('tbody input[type="checkbox"]:checked');
    const countEl = bulkBar.querySelector('.bulk-count');
    if (countEl) countEl.textContent = `تم تحديد ${checked.length} عنصر`;
    bulkBar.classList.toggle('visible', checked.length > 0);
  };

  if (masterCb) {
    masterCb.addEventListener('change', function() {
      table.querySelectorAll('tbody input[type="checkbox"]').forEach(cb => {
        cb.checked = this.checked;
      });
      updateBulkBar();
    });
  }

  table.querySelectorAll('tbody input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', updateBulkBar);
  });
}

// ---- PAGINATION ----
function initPagination(tableId, pageSize = 10) {
  const table = document.getElementById(tableId);
  if (!table) return;
  const rows = Array.from(table.querySelectorAll('tbody tr'));
  const totalPages = Math.ceil(rows.length / pageSize);
  let currentPage = 1;

  function showPage(page) {
    currentPage = Math.max(1, Math.min(page, totalPages));
    rows.forEach((row, i) => {
      row.style.display = (i >= (currentPage - 1) * pageSize && i < currentPage * pageSize) ? '' : 'none';
    });
    const pagination = table.closest('.card')?.querySelector('.pagination');
    if (pagination) {
      const info = pagination.querySelector('.pagination-info');
      if (info) info.textContent = `عرض ${(currentPage-1)*pageSize+1}–${Math.min(currentPage*pageSize, rows.length)} من ${rows.length}`;
      const btns = pagination.querySelectorAll('.page-btn[data-page]');
      btns.forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.getAttribute('data-page')) === currentPage);
      });
    }
  }

  // Build pagination controls
  const paginationEl = table.closest('.card')?.querySelector('.pagination');
  if (paginationEl && totalPages > 1) {
    const btnsContainer = paginationEl.querySelector('.pagination-btns');
    if (btnsContainer) {
      btnsContainer.innerHTML = '';
      const prevBtn = document.createElement('button');
      prevBtn.className = 'page-btn';
      prevBtn.textContent = '‹';
      prevBtn.onclick = () => showPage(currentPage - 1);
      btnsContainer.appendChild(prevBtn);

      for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = 'page-btn';
        btn.setAttribute('data-page', i);
        btn.textContent = i;
        btn.onclick = () => showPage(i);
        btnsContainer.appendChild(btn);
      }

      const nextBtn = document.createElement('button');
      nextBtn.className = 'page-btn';
      nextBtn.textContent = '›';
      nextBtn.onclick = () => showPage(currentPage + 1);
      btnsContainer.appendChild(nextBtn);
    }
  }

  showPage(1);
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', function() {
  // Auto-init table sorting
  document.querySelectorAll('table[id]').forEach(table => {
    if (table.querySelector('thead th[data-sort]')) {
      initTableSort(table.id);
    }
  });
});
