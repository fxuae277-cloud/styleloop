// ================================================
// StyleLoop Admin - Navigation JS
// ================================================

// Toggle Sidebar
function toggleSidebar() {
  const sidebar = document.getElementById('adminSidebar');
  const main = document.querySelector('.admin-main');
  const header = document.getElementById('adminHeader');
  const overlay = document.getElementById('sidebarOverlay');

  if (window.innerWidth <= 768) {
    sidebar.classList.toggle('mobile-open');
    if (overlay) overlay.classList.toggle('visible');
  } else {
    sidebar.classList.toggle('collapsed');
    if (main) main.classList.toggle('sidebar-collapsed');
    if (header) header.classList.toggle('sidebar-collapsed');
    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
  }
}

// Toggle Nav Group (accordion)
function toggleNavGroup(btn) {
  const group = btn.closest('.nav-group');
  const isOpen = group.classList.contains('open');
  // Close all groups
  document.querySelectorAll('.nav-group.open').forEach(g => {
    if (g !== group) g.classList.remove('open');
  });
  group.classList.toggle('open', !isOpen);
}

// Dark/Light Mode Toggle
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('adminTheme', newTheme);
  // Update toggle button icon
  const themeBtn = document.querySelector('.header-btn[onclick="toggleTheme()"]');
  if (themeBtn) themeBtn.textContent = isDark ? '🌙' : '☀️';
}

// Notifications Panel Toggle
function toggleNotifications() {
  const panel = document.getElementById('notificationsPanel');
  const userDrop = document.getElementById('userDropdown');
  if (userDrop) userDrop.classList.remove('open');
  if (panel) panel.classList.toggle('open');
}

// User Dropdown Toggle
function toggleUserMenu() {
  const drop = document.getElementById('userDropdown');
  const panel = document.getElementById('notificationsPanel');
  if (panel) panel.classList.remove('open');
  if (drop) drop.classList.toggle('open');
}

// Close dropdowns on outside click
document.addEventListener('click', function(e) {
  const notifPanel = document.getElementById('notificationsPanel');
  const userDrop = document.getElementById('userDropdown');
  const notifBtn = document.querySelector('.notifications-btn');
  const userBtn = document.querySelector('.header-user');

  if (notifPanel && notifPanel.classList.contains('open')) {
    if (!notifPanel.contains(e.target) && notifBtn && !notifBtn.contains(e.target)) {
      notifPanel.classList.remove('open');
    }
  }
  if (userDrop && userDrop.classList.contains('open')) {
    if (!userDrop.contains(e.target) && userBtn && !userBtn.contains(e.target)) {
      userDrop.classList.remove('open');
    }
  }
});

// Header scroll effect
window.addEventListener('scroll', function() {
  const header = document.getElementById('adminHeader');
  if (header) {
    if (window.scrollY > 10) {
      header.style.boxShadow = '0 2px 16px rgba(0,0,0,0.15)';
    } else {
      header.style.boxShadow = '';
    }
  }
});

// Highlight active nav item
function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'admin-dashboard.html';
  document.querySelectorAll('.nav-item, .nav-subitem').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href === path || href.endsWith(path)) {
      link.classList.add('active');
      // Open parent group if in subitem
      const group = link.closest('.nav-group');
      if (group) group.classList.add('open');
    } else {
      link.classList.remove('active');
    }
  });
}

// Init sidebar state from localStorage
function initSidebar() {
  const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  const sidebar = document.getElementById('adminSidebar');
  const main = document.querySelector('.admin-main');
  const header = document.getElementById('adminHeader');
  if (collapsed && window.innerWidth > 768) {
    if (sidebar) sidebar.classList.add('collapsed');
    if (main) main.classList.add('sidebar-collapsed');
    if (header) header.classList.add('sidebar-collapsed');
  }

  // Overlay for mobile
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.id = 'sidebarOverlay';
  overlay.onclick = function() {
    toggleSidebar();
  };
  document.body.appendChild(overlay);
}

// Init theme
function initTheme() {
  const savedTheme = localStorage.getItem('adminTheme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  const themeBtn = document.querySelector('.header-btn[onclick="toggleTheme()"]');
  if (themeBtn) themeBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  initSidebar();
  initTheme();
  setActiveNav();

  // Auto-open active nav group
  document.querySelectorAll('.nav-subitem.active').forEach(item => {
    const group = item.closest('.nav-group');
    if (group) group.classList.add('open');
  });
});

// Handle resize
window.addEventListener('resize', function() {
  const sidebar = document.getElementById('adminSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (window.innerWidth > 768) {
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (overlay) overlay.classList.remove('visible');
  }
});
