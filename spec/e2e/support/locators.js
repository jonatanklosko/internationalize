by.addLocator('clickableText', (text, parentElement) => {
  let elements = (parentElement || document).querySelectorAll('button, a');
  return Array.prototype.filter.call(elements, element => element.textContent === text);
});
