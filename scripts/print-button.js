// Terms & Conditions: makes the "Print Document" button open the browser's print dialog.

document.querySelectorAll('[data-print]').forEach((button) => {
  button.addEventListener('click', () => window.print());
});
