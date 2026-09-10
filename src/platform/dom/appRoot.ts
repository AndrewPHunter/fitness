export function appRoot(): HTMLElement {
  const element = document.getElementById('root');
  if (!element) throw new Error('Application root element is missing.');
  return element;
}
