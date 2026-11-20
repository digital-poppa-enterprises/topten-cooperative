/**
 * Mobile / tablet menu: closes the native popover when a link inside it is chosen.
 *
 * The menu itself opens and closes with HTML + CSS only (popover attribute). The one thing the
 * browser does not do is close a popover when a link inside it points at the SAME page
 * (for example the Services page's "ThriftSave" link, which only jumps to #thriftsave).
 * Links to other pages already leave the page, so this only matters for same-page links.
 */
(() => {
  'use strict';

  const menu = document.getElementById('mobile-menu');
  if (!menu || typeof menu.hidePopover !== 'function') return;

  menu.addEventListener('click', (event) => {
    if (event.target.closest('a[href]') && menu.matches(':popover-open')) menu.hidePopover();
  });

  // If the window grows to desktop width while the menu is open, close it so it is not left "open" in the background.
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (event) => {
    if (event.matches && menu.matches(':popover-open')) menu.hidePopover();
  });
})();
