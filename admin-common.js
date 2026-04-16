/**
 * @fileoverview StyleLoop Admin Panel - Common Utilities
 * @description Shared JavaScript module for all StyleLoop admin pages.
 *   Provides theme management, sidebar navigation, toast notifications,
 *   modal dialogs, form validation, data utilities, table helpers,
 *   and keyboard navigation — all in vanilla ES6+ with zero dependencies.
 * @version 1.0.0
 * @author StyleLoop Team
 */

'use strict';

/**
 * IIFE wrapper to avoid polluting the global namespace.
 * Key public functions are exposed via the global `AdminApp` object.
 */
const AdminApp = (() => {

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 1 · CONSTANTS & PRIVATE STATE
  // ─────────────────────────────────────────────────────────────────────────────

  /** Storage keys used across the module. */
  const STORAGE_KEYS = {
    THEME:           'styleloop_theme',
    SIDEBAR_OPEN:    'styleloop_sidebar_open',
    SIDEBAR_GROUPS:  'styleloop_sidebar_groups',
  };

  /** Supported theme identifiers. */
  const THEMES = { DARK: 'dark', LIGHT: 'light' };

  /** Toast type → CSS modifier mapping. */
  const TOAST_TYPES = {
    success: 'toast--success',
    error:   'toast--error',
    warning: 'toast--warning',
    info:    'toast--info',
  };

  /** Default durations (ms). */
  const DEFAULTS = {
    TOAST_DURATION:   4000,
    DEBOUNCE_DELAY:   300,
    ANIMATION_SPEED:  250,
  };

  /** Active modal reference (private). */
  let _activeModal   = null;
  /** Reference to the focus-trap cleanup function for the active modal. */
  let _focusTrapCleanup = null;
  /** Map of table sort state: tableId → { col, asc }. */
  const _sortState   = new Map();

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 2 · THEME MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Toggles between dark and light themes and persists the choice.
   * Updates the `data-theme` attribute on `<html>` and flips the toggle icon.
   * @returns {string} The newly applied theme identifier.
   */
  function toggleTheme() {
    const current  = document.documentElement.getAttribute('data-theme') || THEMES.LIGHT;
    const next     = current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    applyTheme(next);
    return next;
  }

  /**
   * Applies a named theme to the document and stores it in localStorage.
   * @param {string} theme - Theme identifier ('dark' | 'light').
   */
  function applyTheme(theme) {
    const resolved = Object.values(THEMES).includes(theme) ? theme : THEMES.LIGHT;
    document.documentElement.setAttribute('data-theme', resolved);
    localStorage.setItem(STORAGE_KEYS.THEME, resolved);
    _updateThemeToggleUI(resolved);
  }

  /**
   * Reads the stored theme (or prefers system colour scheme) and applies it.
   * Should be called as early as possible to prevent flash-of-wrong-theme.
   */
  function initTheme() {
    const stored  = localStorage.getItem(STORAGE_KEYS.THEME);
    const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? THEMES.DARK : THEMES.LIGHT;
    applyTheme(stored || prefers);

    // Keep in sync when OS preference changes and no explicit choice was made.
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        if (!localStorage.getItem(STORAGE_KEYS.THEME)) {
          applyTheme(e.matches ? THEMES.DARK : THEMES.LIGHT);
        }
      });
  }

  /**
   * Updates theme-toggle button icon/label to reflect the active theme.
   * @param {string} theme - The currently active theme.
   * @private
   */
  function _updateThemeToggleUI(theme) {
    const btn  = document.querySelector('[data-action="toggle-theme"]');
    if (!btn) return;
    const icon = btn.querySelector('.theme-icon');
    if (icon) icon.textContent = theme === THEMES.DARK ? '☀️' : '🌙';
    btn.setAttribute('aria-label',
      theme === THEMES.DARK ? 'Switch to light mode' : 'Switch to dark mode');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 3 · SIDEBAR MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Collapses or expands the admin sidebar.
   * Persists expanded/collapsed state in localStorage.
   */
  function toggleSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (!sidebar) return;

    const isOpen = sidebar.classList.toggle('sidebar--open');
    sidebar.setAttribute('aria-expanded', String(isOpen));
    if (overlay) overlay.classList.toggle('overlay--visible', isOpen);
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_OPEN, String(isOpen));

    // On mobile, prevent body scroll when sidebar is open.
    document.body.classList.toggle('no-scroll', isOpen && _isMobile());
  }

  /**
   * Expands or collapses a named sidebar menu group with a smooth height animation.
   * The expanded/collapsed state for each group is persisted in localStorage.
   * @param {string} groupId - The `id` of the `<ul>` submenu element to toggle.
   */
  function toggleMenuGroup(groupId) {
    const group   = document.getElementById(groupId);
    const trigger = document.querySelector(`[data-group="${groupId}"]`);
    if (!group) return;

    const isExpanded = group.classList.contains('menu-group--expanded');

    // Animate height: collapsed → full or full → 0.
    if (isExpanded) {
      group.style.height = `${group.scrollHeight}px`;
      // Force reflow so the transition fires correctly.
      group.getBoundingClientRect();
      group.style.height = '0';
      group.addEventListener('transitionend', () => {
        group.classList.remove('menu-group--expanded');
        group.style.height = '';
      }, { once: true });
    } else {
      group.classList.add('menu-group--expanded');
      group.style.height = `${group.scrollHeight}px`;
      group.addEventListener('transitionend', () => {
        group.style.height = '';
      }, { once: true });
    }

    if (trigger) {
      trigger.setAttribute('aria-expanded', String(!isExpanded));
    }

    // Persist open groups as a JSON array.
    _persistGroupState(groupId, !isExpanded);
  }

  /**
   * Scans all nav links and adds the `.active` class to the one whose
   * `href` matches (or is a prefix of) the current page URL.
   */
  function setActiveMenuItem() {
    const path  = window.location.pathname.split('/').pop() || 'index.html';
    const links = document.querySelectorAll('.sidebar-nav a[href]');

    links.forEach((link) => {
      const linkPath = link.getAttribute('href').split('/').pop();
      const isActive = linkPath === path;
      link.classList.toggle('nav-link--active', isActive);
      link.setAttribute('aria-current', isActive ? 'page' : 'false');

      // Auto-expand the parent group that contains the active link.
      if (isActive) {
        const parentGroup = link.closest('.menu-group--collapsible');
        if (parentGroup && !parentGroup.classList.contains('menu-group--expanded')) {
          parentGroup.classList.add('menu-group--expanded');
        }
      }
    });
  }

  /**
   * Restores sidebar open/collapsed state and menu-group states from localStorage,
   * attaches toggle event listeners, and highlights the active menu item.
   */
  function initSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    if (!sidebar) return;

    // Restore sidebar open/closed state (default open on desktop).
    const storedOpen = localStorage.getItem(STORAGE_KEYS.SIDEBAR_OPEN);
    const shouldOpen = storedOpen !== null ? storedOpen === 'true' : !_isMobile();
    sidebar.classList.toggle('sidebar--open', shouldOpen);
    sidebar.setAttribute('aria-expanded', String(shouldOpen));

    // Restore individual menu-group states.
    const storedGroups = _getStoredGroups();
    storedGroups.forEach((groupId) => {
      const el = document.getElementById(groupId);
      if (el) el.classList.add('menu-group--expanded');
    });

    // Wire up toggle button(s).
    document.querySelectorAll('[data-action="toggle-sidebar"]')
      .forEach((btn) => btn.addEventListener('click', toggleSidebar));

    // Wire up overlay click to close sidebar on mobile.
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) overlay.addEventListener('click', () => {
      if (_isMobile()) toggleSidebar();
    });

    // Wire up collapsible group triggers.
    document.querySelectorAll('[data-group]').forEach((trigger) => {
      trigger.addEventListener('click', () => toggleMenuGroup(trigger.dataset.group));
    });

    setActiveMenuItem();
  }

  /**
   * Reads the list of open sidebar groups from localStorage.
   * @returns {string[]} Array of group element IDs that should be expanded.
   * @private
   */
  function _getStoredGroups() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SIDEBAR_GROUPS) || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Persists the expanded/collapsed state of a menu group.
   * @param {string} groupId - Element ID of the menu group.
   * @param {boolean} isExpanded - Whether the group is now expanded.
   * @private
   */
  function _persistGroupState(groupId, isExpanded) {
    const groups = new Set(_getStoredGroups());
    if (isExpanded) groups.add(groupId);
    else groups.delete(groupId);
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_GROUPS, JSON.stringify([...groups]));
  }

  /**
   * Returns true when the viewport is narrower than 768 px (mobile breakpoint).
   * @returns {boolean}
   * @private
   */
  function _isMobile() {
    return window.innerWidth < 768;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 4 · TOAST NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Creates and displays an animated toast notification.
   * Toasts are stacked in a container appended to `<body>`.
   *
   * @param {string} message        - Human-readable notification text.
   * @param {'success'|'error'|'warning'|'info'} [type='info'] - Visual style.
   * @param {number} [duration=4000] - Auto-dismiss delay in milliseconds.
   *   Pass `0` to keep the toast until manually dismissed.
   * @returns {HTMLElement} The created toast element.
   */
  function showToast(message, type = 'info', duration = DEFAULTS.TOAST_DURATION) {
    const container = _ensureToastContainer();
    const typeClass = TOAST_TYPES[type] || TOAST_TYPES.info;
    const icons     = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

    const toast = document.createElement('div');
    toast.className      = `toast ${typeClass}`;
    toast.role           = 'alert';
    toast.ariaLive       = 'assertive';
    toast.ariaAtomic     = 'true';
    toast.innerHTML = `
      <span class="toast__icon" aria-hidden="true">${icons[type] || icons.info}</span>
      <span class="toast__message">${_escapeHTML(message)}</span>
      <button class="toast__close" aria-label="Dismiss notification" type="button">✕</button>
    `;

    // Dismiss on close-button click.
    toast.querySelector('.toast__close').addEventListener('click', () => hideToast(toast));

    container.appendChild(toast);

    // Trigger enter animation on next frame.
    requestAnimationFrame(() => toast.classList.add('toast--visible'));

    // Auto-dismiss unless duration is 0.
    if (duration > 0) {
      setTimeout(() => hideToast(toast), duration);
    }

    return toast;
  }

  /**
   * Animates a toast out and removes it from the DOM.
   * @param {HTMLElement} toastEl - The toast element to dismiss.
   */
  function hideToast(toastEl) {
    if (!toastEl || toastEl.classList.contains('toast--hiding')) return;
    toastEl.classList.add('toast--hiding');
    toastEl.classList.remove('toast--visible');
    toastEl.addEventListener('transitionend', () => toastEl.remove(), { once: true });
    // Fallback removal in case transition doesn't fire.
    setTimeout(() => toastEl.remove(), DEFAULTS.ANIMATION_SPEED + 50);
  }

  /**
   * Ensures the toast stack container exists in the DOM, creating it if needed.
   * @returns {HTMLElement} The toast container element.
   * @private
   */
  function _ensureToastContainer() {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container         = document.createElement('div');
      container.id      = 'toastContainer';
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-relevant', 'additions');
      document.body.appendChild(container);
    }
    return container;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 5 · MODAL MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * @typedef {Object} ModalButton
   * @property {string}   text      - Button label.
   * @property {string}   [type]    - 'primary' | 'secondary' | 'danger' (default 'secondary').
   * @property {Function} [onClick] - Callback invoked when the button is clicked.
   *   Return `false` to prevent the modal from closing automatically.
   */

  /**
   * @typedef {Object} ModalOptions
   * @property {string}          title    - Modal heading text.
   * @property {string}          content  - Inner HTML / text for the modal body.
   * @property {ModalButton[]}   [buttons] - Action buttons rendered in the footer.
   * @property {boolean}         [closable=true] - Whether the × button / Escape key close it.
   * @property {string}          [size]   - 'sm' | 'md' | 'lg' (default 'md').
   */

  /**
   * Builds, inserts, and displays a modal dialog.
   * The previously open modal (if any) is closed first.
   *
   * @param {ModalOptions} options - Configuration object.
   * @returns {HTMLElement} The modal root element.
   */
  function showModal(options = {}) {
    const {
      title    = '',
      content  = '',
      buttons  = [],
      closable = true,
      size     = 'md',
    } = options;

    // Close any existing modal before opening a new one.
    if (_activeModal) hideModal();

    // Build backdrop.
    const backdrop    = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');

    // Build modal shell.
    const modal = document.createElement('div');
    modal.className  = `modal modal--${size}`;
    modal.role       = 'dialog';
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'modalTitle');

    // Build inner HTML.
    const buttonsHTML = buttons.map((btn, i) => {
      const btnType = btn.type || 'secondary';
      return `<button class="btn btn--${btnType}" data-modal-btn="${i}" type="button">${_escapeHTML(btn.text)}</button>`;
    }).join('');

    modal.innerHTML = `
      <div class="modal__header">
        <h2 class="modal__title" id="modalTitle">${_escapeHTML(title)}</h2>
        ${closable ? '<button class="modal__close" aria-label="Close dialog" type="button">✕</button>' : ''}
      </div>
      <div class="modal__body">${content}</div>
      ${buttonsHTML ? `<div class="modal__footer">${buttonsHTML}</div>` : ''}
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);
    document.body.classList.add('modal--open');

    _activeModal = modal;

    // Animate in.
    requestAnimationFrame(() => {
      backdrop.classList.add('modal-backdrop--visible');
      modal.classList.add('modal--visible');
    });

    // Wire up close button.
    if (closable) {
      modal.querySelector('.modal__close')
        ?.addEventListener('click', hideModal);
      backdrop.addEventListener('click', hideModal);
    }

    // Wire up action buttons.
    buttons.forEach((btn, i) => {
      modal.querySelector(`[data-modal-btn="${i}"]`)
        ?.addEventListener('click', () => {
          const shouldClose = typeof btn.onClick === 'function' ? btn.onClick() : true;
          if (shouldClose !== false) hideModal();
        });
    });

    // Trap focus inside the modal.
    _focusTrapCleanup = focusTrap(modal);

    // Focus first focusable element.
    const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    firstFocusable?.focus();

    return modal;
  }

  /**
   * Closes and removes the currently active modal dialog.
   * Restores body scroll and focus to the element that triggered the modal.
   */
  function hideModal() {
    if (!_activeModal) return;

    const modal    = _activeModal;
    const backdrop = document.querySelector('.modal-backdrop');

    modal.classList.remove('modal--visible');
    backdrop?.classList.remove('modal-backdrop--visible');

    const onEnd = () => {
      modal.remove();
      backdrop?.remove();
      document.body.classList.remove('modal--open');
      _activeModal = null;
      if (typeof _focusTrapCleanup === 'function') {
        _focusTrapCleanup();
        _focusTrapCleanup = null;
      }
    };

    modal.addEventListener('transitionend', onEnd, { once: true });
    setTimeout(onEnd, DEFAULTS.ANIMATION_SPEED + 50); // Fallback.
  }

  /**
   * Constrains keyboard focus to `element` while it is open (WCAG 2.1 §2.1.2).
   * Returns a cleanup function that removes the event listener.
   *
   * @param {HTMLElement} element - The container to trap focus inside.
   * @returns {Function} Cleanup function — call to remove the trap.
   */
  function focusTrap(element) {
    const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function handler(e) {
      if (e.key !== 'Tab') return;
      const focusable = [...element.querySelectorAll(FOCUSABLE)];
      if (focusable.length === 0) { e.preventDefault(); return; }

      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 6 · FORM UTILITIES
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Validates all inputs/selects/textareas inside `formEl` according to
   * `data-` attribute rules. Returns `true` when the form is valid.
   *
   * Supported rules (via standard HTML attributes or data attributes):
   * - `required`               – Field must not be empty.
   * - `type="email"`           – Must match a basic e-mail pattern.
   * - `minlength` / `maxlength` – String length constraints.
   * - `min` / `max`            – Numeric value constraints.
   * - `pattern`                – Custom RegExp (attribute value).
   * - `data-match`             – Value must equal another field's value (by id).
   *
   * @param {HTMLFormElement} formEl - The form to validate.
   * @returns {boolean} `true` if all fields pass validation.
   */
  function validateForm(formEl) {
    if (!(formEl instanceof HTMLFormElement)) return false;
    clearFieldErrors(formEl);

    const fields  = [...formEl.querySelectorAll('input, select, textarea')];
    let   isValid = true;

    fields.forEach((field) => {
      if (field.disabled || field.type === 'hidden') return;

      const value = field.value.trim();

      // required
      if (field.required && value === '') {
        showFieldError(field, field.dataset.errorRequired || 'This field is required.');
        isValid = false;
        return;
      }
      if (!field.required && value === '') return; // Optional empty field — skip rest.

      // email
      if (field.type === 'email' && !_isValidEmail(value)) {
        showFieldError(field, field.dataset.errorEmail || 'Please enter a valid email address.');
        isValid = false;
        return;
      }

      // minlength
      const minLen = field.minLength !== -1 ? field.minLength : parseInt(field.dataset.minlength, 10);
      if (!isNaN(minLen) && value.length < minLen) {
        showFieldError(field, field.dataset.errorMinlength || `Minimum ${minLen} characters required.`);
        isValid = false;
        return;
      }

      // maxlength
      const maxLen = field.maxLength !== -1 ? field.maxLength : parseInt(field.dataset.maxlength, 10);
      if (!isNaN(maxLen) && value.length > maxLen) {
        showFieldError(field, field.dataset.errorMaxlength || `Maximum ${maxLen} characters allowed.`);
        isValid = false;
        return;
      }

      // min / max (numeric)
      if (field.type === 'number' || field.dataset.numeric) {
        const num = parseFloat(value);
        if (isNaN(num)) {
          showFieldError(field, 'Please enter a valid number.');
          isValid = false;
          return;
        }
        if (field.min !== '' && num < parseFloat(field.min)) {
          showFieldError(field, field.dataset.errorMin || `Value must be at least ${field.min}.`);
          isValid = false;
          return;
        }
        if (field.max !== '' && num > parseFloat(field.max)) {
          showFieldError(field, field.dataset.errorMax || `Value must not exceed ${field.max}.`);
          isValid = false;
          return;
        }
      }

      // pattern
      if (field.pattern) {
        const re = new RegExp(`^(?:${field.pattern})$`);
        if (!re.test(value)) {
          showFieldError(field, field.dataset.errorPattern || 'Invalid format.');
          isValid = false;
          return;
        }
      }

      // data-match (e.g. confirm password)
      if (field.dataset.match) {
        const target = document.getElementById(field.dataset.match);
        if (target && target.value !== field.value) {
          showFieldError(field, field.dataset.errorMatch || 'Fields do not match.');
          isValid = false;
        }
      }
    });

    return isValid;
  }

  /**
   * Displays an error message beneath a form field and applies an error class.
   * @param {HTMLElement} field   - The input/select/textarea element.
   * @param {string}      message - Error text to display.
   */
  function showFieldError(field, message) {
    field.classList.add('field--error');
    field.setAttribute('aria-invalid', 'true');

    // Re-use an existing error element or create a new one.
    const errorId = `error-${field.id || field.name || Math.random().toString(36).slice(2)}`;
    let   errorEl = document.getElementById(errorId);

    if (!errorEl) {
      errorEl        = document.createElement('span');
      errorEl.id     = errorId;
      errorEl.className = 'field-error';
      errorEl.setAttribute('role', 'alert');
      field.insertAdjacentElement('afterend', errorEl);
    }

    errorEl.textContent = message;
    field.setAttribute('aria-describedby', errorId);
  }

  /**
   * Removes all field-level validation errors from a form.
   * @param {HTMLFormElement} formEl - The form to clear errors from.
   */
  function clearFieldErrors(formEl) {
    formEl.querySelectorAll('.field--error').forEach((field) => {
      field.classList.remove('field--error');
      field.removeAttribute('aria-invalid');
      field.removeAttribute('aria-describedby');
    });
    formEl.querySelectorAll('.field-error').forEach((el) => el.remove());
  }

  /**
   * Basic RFC 5322-ish email format check.
   * @param {string} email
   * @returns {boolean}
   * @private
   */
  function _isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 7 · DATA UTILITIES
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Converts an array of flat objects into a CSV file and triggers a download.
   * Column headers are derived from the keys of the first object.
   *
   * @param {Object[]} data     - Array of row objects.
   * @param {string}   filename - Downloaded file name (without extension).
   */
  function exportToCSV(data, filename = 'export') {
    if (!Array.isArray(data) || data.length === 0) {
      showToast('No data to export.', 'warning');
      return;
    }

    const headers = Object.keys(data[0]);
    const escape  = (v) => {
      const str = v == null ? '' : String(v);
      // Wrap in quotes if the value contains commas, quotes, or newlines.
      return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };

    const rows = [
      headers.map(escape).join(','),
      ...data.map((row) => headers.map((h) => escape(row[h])).join(',')),
    ];

    const blob = new Blob(['\uFEFF' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = Object.assign(document.createElement('a'), {
      href:     url,
      download: `${filename}.csv`,
    });

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    showToast(`Exported ${data.length} rows as ${filename}.csv`, 'success');
  }

  /**
   * Formats a numeric amount as Saudi Riyal (SAR) currency.
   * Falls back to a simple string if the Intl API is unavailable.
   *
   * @param {number} amount            - The numeric value to format.
   * @param {string} [currency='SAR']  - ISO 4217 currency code.
   * @param {string} [locale='ar-SA']  - BCP 47 locale tag.
   * @returns {string} Formatted currency string, e.g. "٣٬٥٠٠٫٠٠ ر.س.‏".
   */
  function formatCurrency(amount, currency = 'SAR', locale = 'ar-SA') {
    if (isNaN(amount)) return String(amount);
    try {
      return new Intl.NumberFormat(locale, {
        style:                 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${Number(amount).toFixed(2)} ${currency}`;
    }
  }

  /**
   * Formats a date value using the Arabic (Saudi) locale by default.
   *
   * @param {Date|string|number} date  - Date value accepted by `new Date()`.
   * @param {string} [locale='ar-SA'] - BCP 47 locale tag.
   * @param {Intl.DateTimeFormatOptions} [options]  - Override format options.
   * @returns {string} Formatted date string.
   */
  function formatDate(date, locale = 'ar-SA', options = {}) {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d)) return String(date);
    const defaults = { year: 'numeric', month: 'long', day: 'numeric' };
    try {
      return new Intl.DateTimeFormat(locale, { ...defaults, ...options }).format(d);
    } catch {
      return d.toLocaleDateString();
    }
  }

  /**
   * Formats a number with locale-aware thousands separators.
   *
   * @param {number} num              - The number to format.
   * @param {string} [locale='ar-SA'] - BCP 47 locale tag.
   * @returns {string} Formatted number string.
   */
  function formatNumber(num, locale = 'ar-SA') {
    if (isNaN(num)) return String(num);
    try {
      return new Intl.NumberFormat(locale).format(num);
    } catch {
      return num.toLocaleString();
    }
  }

  /**
   * Returns a debounced version of `fn` that delays invocation until `delay` ms
   * after the last call. Useful for search/filter inputs.
   *
   * @template {(...args: any[]) => any} T
   * @param {T}      fn    - The function to debounce.
   * @param {number} delay - Milliseconds to wait (default 300).
   * @returns {T} Debounced function.
   */
  function debounce(fn, delay = DEFAULTS.DEBOUNCE_DELAY) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 8 · TABLE UTILITIES
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Enhances an HTML `<table>` with client-side sorting and filtering.
   * Sortable columns should have `data-sortable="true"` on their `<th>`.
   *
   * @param {string} tableId        - The `id` attribute of the `<table>` element.
   * @param {Object} [options={}]   - Configuration overrides.
   * @param {string} [options.searchInputId] - ID of an `<input>` to auto-wire for filtering.
   */
  function initDataTable(tableId, options = {}) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const { searchInputId } = options;

    // Initialise sort-state for this table.
    _sortState.set(tableId, { col: -1, asc: true });

    // Wire sortable column headers.
    const headers = table.querySelectorAll('th[data-sortable]');
    headers.forEach((th, index) => {
      th.style.cursor = 'pointer';
      th.setAttribute('tabindex', '0');
      th.setAttribute('role', 'columnheader');
      th.setAttribute('aria-sort', 'none');

      const onClick = () => sortTable(tableId, index);
      th.addEventListener('click', onClick);
      th.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
      });
    });

    // Auto-wire a search input if provided.
    if (searchInputId) {
      const input = document.getElementById(searchInputId);
      if (input) {
        input.addEventListener('input', debounce((e) => {
          filterTable(tableId, e.target.value);
        }));
      }
    }
  }

  /**
   * Filters table body rows by whether any cell contains `searchValue` (case-insensitive).
   * Hidden rows are excluded from view but not removed from the DOM.
   *
   * @param {string} tableId     - The `id` of the target `<table>`.
   * @param {string} searchValue - The search string.
   */
  function filterTable(tableId, searchValue) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const query = searchValue.trim().toLowerCase();
    const rows  = table.querySelectorAll('tbody tr');
    let   count = 0;

    rows.forEach((row) => {
      const text    = row.textContent.toLowerCase();
      const visible = query === '' || text.includes(query);
      row.style.display = visible ? '' : 'none';
      if (visible) count++;
    });

    // Update an optional row-count indicator.
    const counter = document.getElementById(`${tableId}-count`);
    if (counter) counter.textContent = count;
  }

  /**
   * Sorts a table by the specified column index, toggling direction on repeated clicks.
   * Supports text, numeric, and date cell content automatically.
   *
   * @param {string} tableId     - The `id` of the target `<table>`.
   * @param {number} columnIndex - Zero-based index of the column to sort.
   */
  function sortTable(tableId, columnIndex) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const state = _sortState.get(tableId) || { col: -1, asc: true };
    const asc   = state.col === columnIndex ? !state.asc : true;
    _sortState.set(tableId, { col: columnIndex, asc });

    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const rows    = [...tbody.querySelectorAll('tr')];
    const getValue = (row) => {
      const cell = row.cells[columnIndex];
      return cell ? cell.dataset.sort || cell.textContent.trim() : '';
    };

    rows.sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      const na = parseFloat(va);
      const nb = parseFloat(vb);

      let result;
      if (!isNaN(na) && !isNaN(nb)) {
        result = na - nb;
      } else {
        result = va.localeCompare(vb, 'ar', { sensitivity: 'base' });
      }
      return asc ? result : -result;
    });

    rows.forEach((row) => tbody.appendChild(row));

    // Update aria-sort on all headers.
    const headers = table.querySelectorAll('th[data-sortable]');
    headers.forEach((th, i) => {
      th.setAttribute('aria-sort',
        i === columnIndex ? (asc ? 'ascending' : 'descending') : 'none');
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 9 · KEYBOARD NAVIGATION
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Registers global keyboard shortcuts for the admin panel:
   *
   * | Key          | Action                                 |
   * |--------------|----------------------------------------|
   * | `Escape`     | Close active modal or sidebar (mobile) |
   * | `/`          | Focus the global search input          |
   * | `Alt+T`      | Toggle dark/light theme                |
   * | `Alt+S`      | Toggle sidebar                         |
   */
  function initKeyboardNav() {
    document.addEventListener('keydown', (e) => {
      // Ignore key events originating inside text inputs (except Escape).
      const tag = document.activeElement?.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      switch (e.key) {
        case 'Escape':
          if (_activeModal) { hideModal(); break; }
          if (_isMobile()) {
            const sidebar = document.getElementById('adminSidebar');
            if (sidebar?.classList.contains('sidebar--open')) toggleSidebar();
          }
          break;

        case '/':
          if (!inInput) {
            e.preventDefault();
            const search = document.querySelector('[data-role="global-search"], #globalSearch');
            search?.focus();
          }
          break;

        case 't':
        case 'T':
          if (e.altKey) { e.preventDefault(); toggleTheme(); }
          break;

        case 's':
        case 'S':
          if (e.altKey) { e.preventDefault(); toggleSidebar(); }
          break;
      }
    });

    handleSidebarKeyboard();
  }

  /**
   * Enables arrow-key navigation through sidebar menu links.
   * `ArrowDown` / `ArrowUp` move focus between nav links.
   * `ArrowRight` opens a collapsed submenu; `ArrowLeft` collapses it.
   */
  function handleSidebarKeyboard() {
    const sidebar = document.getElementById('adminSidebar');
    if (!sidebar) return;

    sidebar.addEventListener('keydown', (e) => {
      const links = [...sidebar.querySelectorAll('.sidebar-nav a, .sidebar-nav [data-group]')];
      const current = links.indexOf(document.activeElement);

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const next = links[current + 1] || links[0];
          next?.focus();
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const prev = links[current - 1] || links[links.length - 1];
          prev?.focus();
          break;
        }
        case 'ArrowRight': {
          const groupId = document.activeElement?.dataset?.group;
          if (groupId) {
            const group = document.getElementById(groupId);
            if (!group?.classList.contains('menu-group--expanded')) toggleMenuGroup(groupId);
          }
          break;
        }
        case 'ArrowLeft': {
          const groupId = document.activeElement?.dataset?.group;
          if (groupId) {
            const group = document.getElementById(groupId);
            if (group?.classList.contains('menu-group--expanded')) toggleMenuGroup(groupId);
          }
          break;
        }
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 10 · PAGE INITIALIZATION
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Master initializer — call once on every admin page after the DOM is ready.
   * Bootstraps all sub-modules: theme, sidebar, keyboard navigation, and
   * wires up declarative `data-action` handlers.
   *
   * @example
   * // In each admin HTML page, before </body>:
   * document.addEventListener('DOMContentLoaded', AdminApp.initAdminPage);
   */
  function initAdminPage() {
    initTheme();
    initSidebar();
    initKeyboardNav();
    _wireDeclarativeActions();

    // Emit a custom event so page-specific scripts can hook in.
    document.dispatchEvent(new CustomEvent('adminapp:ready', { detail: { AdminApp } }));
  }

  /**
   * Wires up all `[data-action]` elements in the document so pages need
   * minimal inline JavaScript.
   *
   * Supported values of `data-action`:
   * - `"toggle-theme"`   → `toggleTheme()`
   * - `"toggle-sidebar"` → `toggleSidebar()`
   * - `"hide-modal"`     → `hideModal()`
   * - `"export-csv"`     → reads `data-table-id` and `data-filename`
   * @private
   */
  function _wireDeclarativeActions() {
    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-action]');
      if (!el) return;

      switch (el.dataset.action) {
        case 'toggle-theme':
          toggleTheme();
          break;
        case 'toggle-sidebar':
          toggleSidebar();
          break;
        case 'hide-modal':
          hideModal();
          break;
        case 'export-csv': {
          const tableId  = el.dataset.tableId;
          const filename = el.dataset.filename || 'export';
          if (tableId) {
            const rows = _tableToObjects(tableId);
            exportToCSV(rows, filename);
          }
          break;
        }
      }
    });
  }

  /**
   * Extracts a `<table>`'s data as an array of plain objects keyed by header text.
   * @param {string} tableId - ID of the target table.
   * @returns {Object[]} Array of row data objects.
   * @private
   */
  function _tableToObjects(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return [];

    const headers = [...table.querySelectorAll('thead th')]
      .map((th) => th.textContent.trim());

    return [...table.querySelectorAll('tbody tr')]
      .filter((row) => row.style.display !== 'none')
      .map((row) => {
        const obj = {};
        [...row.cells].forEach((cell, i) => {
          obj[headers[i] || i] = cell.textContent.trim();
        });
        return obj;
      });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 11 · SHARED HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Escapes characters that have special meaning in HTML to prevent XSS when
   * injecting user-supplied content into `innerHTML`.
   *
   * @param {string} str - Raw string to escape.
   * @returns {string} HTML-safe string.
   */
  function _escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Public surface of the AdminApp module.
   * Only functions that page-level code needs to call directly are exposed here.
   */
  return Object.freeze({
    // Theme
    toggleTheme,
    applyTheme,
    initTheme,

    // Sidebar
    toggleSidebar,
    toggleMenuGroup,
    setActiveMenuItem,
    initSidebar,

    // Toasts
    showToast,
    hideToast,

    // Modals
    showModal,
    hideModal,
    focusTrap,

    // Forms
    validateForm,
    showFieldError,
    clearFieldErrors,

    // Data utilities
    exportToCSV,
    formatCurrency,
    formatDate,
    formatNumber,
    debounce,

    // Tables
    initDataTable,
    filterTable,
    sortTable,

    // Keyboard
    initKeyboardNav,
    handleSidebarKeyboard,

    // Master init
    initAdminPage,
  });

})();

// Auto-initialise when the DOM is ready so pages don't need boilerplate.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', AdminApp.initAdminPage);
} else {
  // DOM already parsed (script loaded with `defer` or at end of body).
  AdminApp.initAdminPage();
}
