/**
 * StyleLoop — Shared Navigation + Footer Injector
 * Handles bilingual AR/EN toggle with localStorage persistence.
 * Include in every public page's <head>:
 *   <script src="assets/js/nav.js"></script>
 *   (adjust path depth if needed, e.g. ../assets/js/nav.js)
 */
(function () {
  /* ── 1. Language setup ──────────────────────────────────────────── */
  var lang = localStorage.getItem('sl-lang') || 'ar';
  var isRTL = lang === 'ar';
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');

  /* ── 2. Translations ────────────────────────────────────────────── */
  var t = {
    ar: {
      home: 'الرئيسية',
      products: 'المنتجات',
      tryon: 'جرّبي الآن',
      sell: 'بيعي ملابسك',
      cart: 'السلة',
      wallet: 'محفظتي',
      dashboard: 'حسابي',
      about: 'من نحن',
      contact: 'تواصلي',
      langToggle: 'EN',
      tryNowBtn: '✨ جرّبي الآن',
      /* footer */
      ftShop: 'تسوق',
      ftAccount: 'حسابي',
      ftSupport: 'الدعم',
      ftAllProducts: 'جميع المنتجات',
      ftTryon: 'استوديو التجربة',
      ftSell: 'بيع ملابسي',
      ftDashboard: 'لوحة التحكم',
      ftCartLink: 'سلة التسوق',
      ftWallet: 'محفظتي الذكية',
      ftAbout: 'من نحن',
      ftContact: 'اتصلي بنا',
      ftPrivacy: 'سياسة الخصوصية',
      ftTerms: 'شروط الاستخدام',
      ftTagline: 'جرّبي الملابس عليك بالذكاء الاصطناعي قبل الشراء.',
      ftCopyright: '© ٢٠٢٦ StyleLoop. جميع الحقوق محفوظة.',
      ftCredit: 'صُنع بـ 💗 لمستقبل أجمل',
      ftPayLabel: 'وسائل الدفع:'
    },
    en: {
      home: 'Home',
      products: 'Products',
      tryon: 'Try-On',
      sell: 'Sell',
      cart: 'Cart',
      wallet: 'Wallet',
      dashboard: 'Dashboard',
      about: 'About',
      contact: 'Contact',
      langToggle: 'AR',
      tryNowBtn: '✨ Try Now',
      /* footer */
      ftShop: 'Shop',
      ftAccount: 'Account',
      ftSupport: 'Support',
      ftAllProducts: 'All Products',
      ftTryon: 'Try-On Studio',
      ftSell: 'Sell Clothes',
      ftDashboard: 'Dashboard',
      ftCartLink: 'Shopping Cart',
      ftWallet: 'My Wallet',
      ftAbout: 'About Us',
      ftContact: 'Contact Us',
      ftPrivacy: 'Privacy Policy',
      ftTerms: 'Terms of Use',
      ftTagline: 'Try clothes on with AI before buying.',
      ftCopyright: '© 2026 StyleLoop. All rights reserved.',
      ftCredit: 'Made with 💗 for a better future',
      ftPayLabel: 'Payment methods:'
    }
  };
  var tr = t[lang];

  /* ── 3. Active-page detection ───────────────────────────────────── */
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  if (currentPage === '') currentPage = 'index.html';

  function active(page) {
    return currentPage === page ? ' class="sl-active"' : '';
  }

  /* ── 4. CSS injection ───────────────────────────────────────────── */
  var css = [
    /* Root tokens (only set if not already defined) */
    ':root{',
    '--sl-pink:#E91E63;--sl-pink2:#F06292;--sl-pink3:#F8BBD0;--sl-pink4:#FCE4EC;--sl-pink5:#FFF0F5;',
    '--sl-gold:#C9A96E;--sl-gold3:#F5E6C8;--sl-gold4:#FFF8E8;',
    '--sl-t1:#2A2A2A;--sl-t2:#666;--sl-t3:#999;',
    '--sl-line:#F0E8EA;--sl-bg2:#FAFAF8;',
    '--sl-radius:14px;--sl-ease:cubic-bezier(.16,1,.3,1);',
    '--sl-fc:"Cairo",sans-serif;--sl-fp:"Poppins",sans-serif;',
    '--sl-shadow:0 2px 20px rgba(233,30,99,.06);--sl-shadow4:0 4px 15px rgba(0,0,0,.04)',
    '}',

    /* Shared body offset */
    'body{padding-top:68px}',

    /* NAV */
    '.sl-nav{',
    'position:fixed;top:0;inset-inline-start:0;inset-inline-end:0;z-index:10000;',
    'padding:.8rem 2.5rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;',
    'background:rgba(255,255,255,.92);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);',
    'border-bottom:1px solid var(--sl-line);box-shadow:var(--sl-shadow);',
    'font-family:var(--sl-fc);transition:all .4s var(--sl-ease);',
    '}',
    '.sl-nav *,.sl-footer *{box-sizing:border-box;margin:0;padding:0}',
    '.sl-nav ul{list-style:none}',

    /* Logo */
    '.sl-logo{display:flex;align-items:center;gap:.45rem;text-decoration:none;flex-shrink:0}',
    '.sl-logo-icon{width:34px;height:34px;background:linear-gradient(135deg,var(--sl-pink),var(--sl-pink2));',
    'border-radius:50%;display:grid;place-items:center;color:#fff;font-size:.9rem;font-weight:800;',
    'transition:all .4s var(--sl-ease);flex-shrink:0}',
    '.sl-logo:hover .sl-logo-icon{transform:rotate(180deg);border-radius:var(--sl-radius)}',
    '.sl-logo-text{font-family:var(--sl-fp);font-size:1.25rem;font-weight:700;color:var(--sl-t1);letter-spacing:-.02em}',
    '.sl-logo-text span{color:var(--sl-pink)}',

    /* Nav links */
    '.sl-links{display:flex;align-items:center;gap:1.3rem;list-style:none;flex:1;justify-content:center}',
    '.sl-links a{color:var(--sl-t2);text-decoration:none;font-size:.82rem;font-weight:500;',
    'transition:color .3s;position:relative;white-space:nowrap}',
    '.sl-links a:hover,.sl-links a.sl-active{color:var(--sl-pink)}',
    '.sl-links a::after{content:"";position:absolute;bottom:-4px;inset-inline-end:0;width:0;',
    'height:2px;background:var(--sl-pink);border-radius:2px;transition:width .3s var(--sl-ease)}',
    '.sl-links a:hover::after,.sl-links a.sl-active::after{width:100%}',

    /* Actions */
    '.sl-actions{display:flex;align-items:center;gap:.6rem;flex-shrink:0}',
    '.sl-cart{position:relative;width:36px;height:36px;border-radius:50%;background:var(--sl-bg2);',
    'display:grid;place-items:center;cursor:pointer;transition:all .3s;font-size:.95rem;',
    'text-decoration:none;border:none;color:inherit}',
    '.sl-cart:hover{background:var(--sl-pink4)}',
    '.sl-user{width:34px;height:34px;border-radius:50%;',
    'background:linear-gradient(135deg,var(--sl-pink3),var(--sl-gold3));',
    'display:grid;place-items:center;cursor:pointer;font-size:.72rem;font-weight:700;',
    'color:var(--sl-pink);text-decoration:none;border:2px solid #fff;box-shadow:var(--sl-shadow4)}',
    '.sl-lang-btn{padding:.35rem .8rem;background:transparent;border:1.5px solid var(--sl-pink3);',
    'color:var(--sl-pink);border-radius:var(--sl-radius);font-family:var(--sl-fc);font-size:.75rem;',
    'font-weight:700;cursor:pointer;transition:all .3s var(--sl-ease)}',
    '.sl-lang-btn:hover{background:var(--sl-pink4);border-color:var(--sl-pink)}',
    '.sl-trynow{padding:.45rem 1.1rem;background:linear-gradient(135deg,var(--sl-pink),var(--sl-pink2));',
    'color:#fff;border:none;border-radius:var(--sl-radius);font-family:var(--sl-fc);font-size:.78rem;',
    'font-weight:700;cursor:pointer;transition:all .3s var(--sl-ease);',
    'text-decoration:none;display:inline-flex;align-items:center;',
    'box-shadow:0 4px 15px rgba(233,30,99,.2)}',
    '.sl-trynow:hover{transform:translateY(-2px);box-shadow:0 6px 25px rgba(233,30,99,.3)}',

    /* Burger */
    '.sl-burger{display:none;flex-direction:column;gap:5px;cursor:pointer;background:none;border:none;padding:4px}',
    '.sl-burger span{width:22px;height:2px;background:var(--sl-t1);border-radius:2px;transition:all .3s}',

    /* Mobile menu */
    '.sl-mobile{display:none;position:fixed;top:0;inset-inline-end:0;',
    'width:min(300px,85vw);height:100vh;background:#fff;z-index:11000;',
    'flex-direction:column;padding:1.5rem;gap:.5rem;',
    'box-shadow:-4px 0 30px rgba(0,0,0,.08);overflow-y:auto}',
    '[dir=ltr] .sl-mobile{inset-inline-end:0}',
    '.sl-mobile.sl-open{display:flex}',
    '.sl-mobile-close{align-self:flex-end;background:none;border:none;',
    'font-size:1.3rem;cursor:pointer;color:var(--sl-t2);margin-bottom:.5rem}',
    '.sl-mobile a{color:var(--sl-t1);text-decoration:none;font-size:.95rem;font-weight:600;',
    'padding:.55rem .5rem;border-bottom:1px solid var(--sl-line)}',
    '.sl-mobile a:hover{color:var(--sl-pink)}',
    '.sl-mobile .sl-lang-btn{margin-top:.8rem;width:100%;text-align:center}',
    '.sl-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:10500}',
    '.sl-overlay.sl-open{display:block}',

    /* Responsive */
    '@media(max-width:1100px){',
    '.sl-links{display:none}.sl-burger{display:flex}.sl-trynow{display:none}',
    '}',
    '@media(max-width:600px){',
    '.sl-nav{padding:.7rem 1.2rem}',
    '}',

    /* FOOTER */
    '.sl-footer{background:var(--sl-bg2);border-top:1px solid var(--sl-line);',
    'padding:3rem 2.5rem 1.5rem;font-family:var(--sl-fc);margin-top:3rem}',
    '.sl-ft-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:2rem;margin-bottom:2rem}',
    '.sl-ft-brand .sl-logo{margin-bottom:.7rem}',
    '.sl-ft-brand p{font-size:.78rem;color:var(--sl-t3);line-height:1.8;max-width:260px;margin-top:.4rem}',
    '.sl-ft-social{display:flex;gap:.5rem;margin-top:1rem}',
    '.sl-ft-social a{width:34px;height:34px;border-radius:50%;background:#fff;',
    'border:1px solid var(--sl-line);display:grid;place-items:center;font-size:.9rem;',
    'text-decoration:none;transition:all .3s}',
    '.sl-ft-social a:hover{background:var(--sl-pink4);border-color:var(--sl-pink3)}',
    '.sl-ft-col h4{font-size:.75rem;color:var(--sl-t1);font-weight:700;margin-bottom:.7rem;',
    'text-transform:uppercase;letter-spacing:.04em}',
    '.sl-ft-col ul{list-style:none;display:flex;flex-direction:column;gap:.45rem}',
    '.sl-ft-col a{color:var(--sl-t3);text-decoration:none;font-size:.78rem;transition:color .3s}',
    '.sl-ft-col a:hover{color:var(--sl-pink)}',
    '.sl-ft-bot{display:flex;justify-content:space-between;align-items:center;',
    'padding-top:1.2rem;border-top:1px solid var(--sl-line);font-size:.68rem;color:var(--sl-t3)}',
    '.sl-ft-pay{display:flex;gap:.4rem;align-items:center}',
    '.sl-ft-pay-icon{height:20px;background:#fff;border-radius:4px;padding:0 .5rem;',
    'display:grid;place-items:center;font-size:.6rem;font-weight:700;',
    'color:var(--sl-t2);border:1px solid var(--sl-line)}',
    '@media(max-width:900px){.sl-ft-grid{grid-template-columns:1fr 1fr}}',
    '@media(max-width:540px){',
    '.sl-footer{padding:2rem 1.2rem 1rem}',
    '.sl-ft-grid{grid-template-columns:1fr}',
    '.sl-ft-bot{flex-direction:column;gap:.4rem;text-align:center}',
    '}'
  ].join('');

  var styleEl = document.createElement('style');
  styleEl.id = 'sl-shared-styles';
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ── 5. HTML builders ───────────────────────────────────────────── */
  function buildNav() {
    return (
      '<nav class="sl-nav" id="sl-nav">' +
        '<a class="sl-logo" href="index.html">' +
          '<div class="sl-logo-icon">S</div>' +
          '<span class="sl-logo-text">Style<span>Loop</span></span>' +
        '</a>' +
        '<ul class="sl-links">' +
          '<li><a href="index.html"' + active('index.html') + '>' + tr.home + '</a></li>' +
          '<li><a href="products.html"' + active('products.html') + '>' + tr.products + '</a></li>' +
          '<li><a href="tryon.html"' + active('tryon.html') + '>' + tr.tryon + '</a></li>' +
          '<li><a href="sell.html"' + active('sell.html') + '>' + tr.sell + '</a></li>' +
          '<li><a href="wallet.html"' + active('wallet.html') + '>' + tr.wallet + '</a></li>' +
          '<li><a href="dashboard.html"' + active('dashboard.html') + '>' + tr.dashboard + '</a></li>' +
          '<li><a href="about.html"' + active('about.html') + '>' + tr.about + '</a></li>' +
          '<li><a href="contact.html"' + active('contact.html') + '>' + tr.contact + '</a></li>' +
        '</ul>' +
        '<div class="sl-actions">' +
          '<a class="sl-cart" href="cart.html" title="' + tr.cart + '">🛒</a>' +
          '<a class="sl-user" href="dashboard.html" title="' + tr.dashboard + '">👤</a>' +
          '<button class="sl-lang-btn" id="sl-lang-btn" onclick="slToggleLang()">' + tr.langToggle + '</button>' +
          '<a class="sl-trynow" href="tryon.html">' + tr.tryNowBtn + '</a>' +
        '</div>' +
        '<button class="sl-burger" id="sl-burger" onclick="slToggleMenu()" aria-label="Menu">' +
          '<span></span><span></span><span></span>' +
        '</button>' +
      '</nav>' +
      '<div class="sl-overlay" id="sl-overlay" onclick="slToggleMenu()"></div>' +
      '<div class="sl-mobile" id="sl-mobile">' +
        '<button class="sl-mobile-close" onclick="slToggleMenu()">✕</button>' +
        '<a href="index.html" onclick="slToggleMenu()">' + tr.home + '</a>' +
        '<a href="products.html" onclick="slToggleMenu()">' + tr.products + '</a>' +
        '<a href="tryon.html" onclick="slToggleMenu()">' + tr.tryon + '</a>' +
        '<a href="sell.html" onclick="slToggleMenu()">' + tr.sell + '</a>' +
        '<a href="cart.html" onclick="slToggleMenu()">' + tr.cart + '</a>' +
        '<a href="wallet.html" onclick="slToggleMenu()">' + tr.wallet + '</a>' +
        '<a href="dashboard.html" onclick="slToggleMenu()">' + tr.dashboard + '</a>' +
        '<a href="about.html" onclick="slToggleMenu()">' + tr.about + '</a>' +
        '<a href="contact.html" onclick="slToggleMenu()">' + tr.contact + '</a>' +
        '<button class="sl-lang-btn" onclick="slToggleLang()" style="margin-top:.8rem;width:100%;text-align:center">' + tr.langToggle + '</button>' +
      '</div>'
    );
  }

  function buildFooter() {
    return (
      '<footer class="sl-footer">' +
        '<div class="sl-ft-grid">' +
          '<div class="sl-ft-brand">' +
            '<a class="sl-logo" href="index.html">' +
              '<div class="sl-logo-icon">S</div>' +
              '<span class="sl-logo-text">Style<span>Loop</span></span>' +
            '</a>' +
            '<p>' + tr.ftTagline + '</p>' +
            '<div class="sl-ft-social">' +
              '<a href="#" title="Instagram">📷</a>' +
              '<a href="#" title="Twitter">🐦</a>' +
              '<a href="#" title="TikTok">🎵</a>' +
              '<a href="#" title="YouTube">▶️</a>' +
            '</div>' +
          '</div>' +
          '<div class="sl-ft-col">' +
            '<h4>' + tr.ftShop + '</h4>' +
            '<ul>' +
              '<li><a href="products.html">' + tr.ftAllProducts + '</a></li>' +
              '<li><a href="tryon.html">' + tr.ftTryon + '</a></li>' +
              '<li><a href="sell.html">' + tr.ftSell + '</a></li>' +
              '<li><a href="cart.html">' + tr.ftCartLink + '</a></li>' +
            '</ul>' +
          '</div>' +
          '<div class="sl-ft-col">' +
            '<h4>' + tr.ftAccount + '</h4>' +
            '<ul>' +
              '<li><a href="dashboard.html">' + tr.ftDashboard + '</a></li>' +
              '<li><a href="wallet.html">' + tr.ftWallet + '</a></li>' +
            '</ul>' +
          '</div>' +
          '<div class="sl-ft-col">' +
            '<h4>' + tr.ftSupport + '</h4>' +
            '<ul>' +
              '<li><a href="about.html">' + tr.ftAbout + '</a></li>' +
              '<li><a href="contact.html">' + tr.ftContact + '</a></li>' +
              '<li><a href="#">' + tr.ftPrivacy + '</a></li>' +
              '<li><a href="#">' + tr.ftTerms + '</a></li>' +
            '</ul>' +
          '</div>' +
        '</div>' +
        '<div class="sl-ft-bot">' +
          '<span>' + tr.ftCopyright + '</span>' +
          '<div class="sl-ft-pay">' +
            '<span>' + tr.ftPayLabel + '</span>' +
            '<span class="sl-ft-pay-icon">VISA</span>' +
            '<span class="sl-ft-pay-icon">مدى</span>' +
            '<span class="sl-ft-pay-icon">Apple Pay</span>' +
            '<span class="sl-ft-pay-icon">STC Pay</span>' +
          '</div>' +
        '</div>' +
      '</footer>'
    );
  }

  /* ── 6. Inject nav + footer on DOM ready ────────────────────────── */
  function inject() {
    /* Nav */
    var navWrap = document.createElement('div');
    navWrap.innerHTML = buildNav();
    /* Insert each child node before body's first child */
    var body = document.body;
    var ref = body.firstChild;
    while (navWrap.firstChild) {
      body.insertBefore(navWrap.firstChild, ref);
    }

    /* Footer — skip if page already has a .sl-footer */
    if (!document.querySelector('.sl-footer')) {
      var ftWrap = document.createElement('div');
      ftWrap.innerHTML = buildFooter();
      while (ftWrap.firstChild) {
        body.appendChild(ftWrap.firstChild);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

  /* ── 7. Handlers (global) ───────────────────────────────────────── */
  window.slToggleLang = function () {
    localStorage.setItem('sl-lang', lang === 'ar' ? 'en' : 'ar');
    location.reload();
  };

  window.slToggleMenu = function () {
    var menu = document.getElementById('sl-mobile');
    var overlay = document.getElementById('sl-overlay');
    if (menu) menu.classList.toggle('sl-open');
    if (overlay) overlay.classList.toggle('sl-open');
  };
})();
