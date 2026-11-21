// Mobile / tablet menu: closes the native popover when a link inside it is chosen.

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
