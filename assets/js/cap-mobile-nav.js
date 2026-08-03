/**
 * CAP — mobile navigation.
 *
 * The site is a static export of a React app, so the original menu never
 * hydrated: the hamburger button is in the markup but nothing listens to it
 * and there is no panel to open. This script wires it up with no dependencies.
 *
 * It reuses the existing button (the three bars animate into a cross) and
 * builds the panel from the links already present in the header, so the menu
 * stays in sync if those change.
 */
(function () {
  'use strict';

  if (window.__capMobileNav) return;
  window.__capMobileNav = true;

  var GREEN = '#00e599';
  var DARK = '#000';

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  // Only the home page ships a hamburger button; the inner pages hide their
  // nav on mobile and offer nothing in its place. Build one that matches.
  function createButton() {
    var header = document.querySelector('header');
    if (!header) return null;
    var host = document.createElement('div');
    host.className = 'cap-mnav-btn-host';
    host.style.cssText = 'position:absolute;top:12px;right:28px;z-index:50;display:none;align-items:center';
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Abrir menú');
    b.style.cssText = 'height:32px;width:32px;position:relative;display:flex;background:none;border:0;padding:0;cursor:pointer;color:#fff';
    var bars = '';
    ['top:8px;left:4px;width:24px', 'top:16px;left:4px;width:24px', 'top:24px;left:4px;width:24px'].forEach(function (p) {
      bars += '<span style="position:absolute;' + p + ';height:2px;background:currentColor;transform-origin:50% 50%;transition:transform .2s,opacity .2s"></span>';
    });
    bars += '<span style="position:absolute;top:16px;left:5px;width:22px;height:2px;background:currentColor;opacity:0;transform-origin:50% 50%;transition:transform .2s,opacity .2s"></span>';
    bars += '<span style="position:absolute;top:16px;left:5px;width:22px;height:2px;background:currentColor;opacity:0;transform-origin:50% 50%;transition:transform .2s,opacity .2s"></span>';
    b.innerHTML = bars;
    host.appendChild(b);
    header.appendChild(host);
    // Show it only where the desktop nav is hidden.
    var mq = document.createElement('style');
    mq.textContent = '@media (max-width:1023px){.cap-mnav-btn-host{display:flex!important}}';
    document.head.appendChild(mq);
    return b;
  }

  ready(function () {
    var btn = document.querySelector('button[aria-label="Open menu"], button[aria-label="Abrir men\u00fa"]') || createButton();
    if (!btn) return;

    // The three bars that morph into a cross. The last two are the cross arms,
    // already positioned by the original markup with opacity 0.
    var bars = btn.querySelectorAll('span');
    var top = bars[0], mid = bars[1], bot = bars[2], x1 = bars[3], x2 = bars[4];

    // --- Links: taken from the header's primary nav ------------------------
    var LINKS = [
      ['Servicios', './services.html'],
      ['Sectores', './industries.html'],
      ['Método', './method.html'],
      ['Casos', './cases.html'],
      ['Nosotros', './about.html'],
      ['Contacto', './contact.html']
    ];

    var style = document.createElement('style');
    style.textContent = [
      // Top padding clears the topbar + header so the first link is not cut off.
      '#cap-mnav{position:fixed;inset:0;z-index:45;background:' + DARK + ';',
      '  display:flex;flex-direction:column;padding:150px 24px 32px;',
      '  opacity:0;visibility:hidden;transform:translateY(-8px);',
      '  transition:opacity .22s ease,transform .22s ease,visibility .22s;',
      '  overflow-y:auto;overscroll-behavior:contain}',
      '#cap-mnav.open{opacity:1;visibility:visible;transform:none}',
      '#cap-mnav a{display:block;padding:18px 0;font-size:26px;line-height:1.2;',
      '  letter-spacing:-.02em;color:#fff;text-decoration:none;',
      '  border-bottom:1px solid rgba(255,255,255,.1);transition:color .2s}',
      '#cap-mnav a:hover,#cap-mnav a:focus-visible{color:' + GREEN + '}',
      '#cap-mnav .cap-mnav-foot{margin-top:auto;padding-top:32px;display:flex;',
      '  gap:24px;font-size:14px}',
      '#cap-mnav .cap-mnav-foot a{padding:0;border:0;font-size:14px;',
      '  color:rgba(255,255,255,.55)}',
      '#cap-mnav .cap-mnav-foot a:hover{color:#fff}',
      'body.cap-mnav-open{overflow:hidden}',
      // Keep the button above the panel so it can close it.
      'button[aria-label="Open menu"],button[aria-label="Abrir men\u00fa"]{z-index:50}'
    ].join('');
    document.head.appendChild(style);

    var panel = document.createElement('nav');
    panel.id = 'cap-mnav';
    panel.setAttribute('aria-label', 'Navegación móvil');
    panel.setAttribute('aria-hidden', 'true');

    var html = LINKS.map(function (l) {
      return '<a href="' + l[1] + '">' + l[0] + '</a>';
    }).join('');
    html += '<div class="cap-mnav-foot">' +
      '<a href="https://www.linkedin.com/company/cap-consultor%C3%ADa-adaptable-para-pymes/" target="_blank" rel="noopener">LinkedIn</a>' +
      '</div>';
    panel.innerHTML = html;
    document.body.appendChild(panel);

    var open = false;

    function setBars(isOpen) {
      // Bars fade out, cross arms fade in.
      [top, mid, bot].forEach(function (b) { if (b) b.style.opacity = isOpen ? '0' : '1'; });
      if (top) top.style.transform = isOpen ? 'translateY(8px)' : 'translateY(0)';
      if (bot) bot.style.transform = isOpen ? 'translateY(-8px)' : 'translateY(0)';
      if (x1) { x1.style.opacity = isOpen ? '1' : '0'; x1.style.transform = isOpen ? 'rotate(45deg) scaleX(0.95)' : 'rotate(0deg) scaleX(0.95)'; }
      if (x2) { x2.style.opacity = isOpen ? '1' : '0'; x2.style.transform = isOpen ? 'rotate(-45deg) scaleX(0.95)' : 'rotate(0deg) scaleX(0.95)'; }
    }

    function setOpen(v) {
      open = v;
      panel.classList.toggle('open', open);
      panel.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.body.classList.toggle('cap-mnav-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      setBars(open);
    }

    btn.setAttribute('aria-controls', 'cap-mnav');
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(!open);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) setOpen(false);
    });

    // Close when navigating, and when the viewport grows back to desktop.
    panel.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') setOpen(false);
    });
    window.addEventListener('resize', function () {
      if (open && window.innerWidth > 1023) setOpen(false);
    });
  });
})();
