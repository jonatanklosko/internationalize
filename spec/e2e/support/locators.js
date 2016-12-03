by.addLocator('clickableText', (text, parentElement) => {
  let elements = (parentElement || document).querySelectorAll('button, a, md-list-item');
  return Array.prototype.filter.call(elements, element => element.textContent.match(text));
});
