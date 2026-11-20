/**
 * Terms & Conditions: makes the "Print Document" button open the browser's print dialog.
 * Printing cannot be done with HTML/CSS alone, so this tiny script is loaded on that page only.
 */
document.querySelectorAll('[data-print]').forEach((button) => {
  button.addEventListener('click', () => window.print());
});
