function revealIfOccluded(control: HTMLElement): void {
  const viewport = window.visualViewport;
  const viewportTop = viewport?.offsetTop ?? 0;
  const viewportBottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight;
  const navigationTop = document.querySelector('.bottom-nav')?.getBoundingClientRect().top;
  const usableBottom = Math.min(viewportBottom, navigationTop ?? viewportBottom);
  const box = control.getBoundingClientRect();
  if (box.top < viewportTop)
    window.scrollBy({ top: box.top - viewportTop - 8, left: 0, behavior: 'auto' });
  else if (box.bottom > usableBottom)
    window.scrollBy({ top: box.bottom - usableBottom + 8, left: 0, behavior: 'auto' });
}

export function keepControlReachable(control: HTMLElement | null): void {
  if (!control) return;
  const viewport = window.visualViewport;
  const reveal = () => revealIfOccluded(control);
  viewport?.addEventListener('resize', reveal, { once: true });
  reveal();
  window.requestAnimationFrame(reveal);
  window.setTimeout(() => {
    viewport?.removeEventListener('resize', reveal);
    reveal();
  }, 350);
}

export function resetPagePosition(): void {
  window.scrollTo({ left: 0, top: 0 });
}
