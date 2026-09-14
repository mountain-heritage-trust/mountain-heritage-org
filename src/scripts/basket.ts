// Client-side basket. See docs/shop.md.
//
// The basket lives only in the visitor's browser (localStorage) as a list
// of { slug, qty } pairs. No prices are stored: the basket page and the
// checkout route both look prices up from the catalogue, so nothing the
// client holds is trusted at payment time.

export interface BasketLine {
  slug: string;
  qty: number;
}

const KEY = 'mht-basket-v1';
export const MAX_QTY = 10;
export const MAX_LINES = 20;
const CHANGE_EVENT = 'basket:change';

function normalise(raw: unknown): BasketLine[] {
  if (!Array.isArray(raw)) return [];
  const out: BasketLine[] = [];
  for (const line of raw) {
    if (!line || typeof line !== 'object') continue;
    const { slug, qty } = line as Record<string, unknown>;
    if (typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) continue;
    const n = Math.floor(Number(qty));
    if (!Number.isFinite(n) || n < 1) continue;
    if (out.some((l) => l.slug === slug)) continue;
    out.push({ slug, qty: Math.min(n, MAX_QTY) });
    if (out.length >= MAX_LINES) break;
  }
  return out;
}

export function readBasket(): BasketLine[] {
  try {
    return normalise(JSON.parse(window.localStorage.getItem(KEY) ?? '[]'));
  } catch {
    return [];
  }
}

function writeBasket(lines: BasketLine[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(normalise(lines)));
  } catch {
    // Private mode / storage disabled: the basket simply won't persist.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function addToBasket(slug: string, qty = 1): void {
  const lines = readBasket();
  const existing = lines.find((l) => l.slug === slug);
  if (existing) existing.qty = Math.min(existing.qty + qty, MAX_QTY);
  else lines.push({ slug, qty });
  writeBasket(lines);
}

export function setQuantity(slug: string, qty: number): void {
  const lines = readBasket().filter((l) => l.slug !== slug || qty > 0);
  const line = lines.find((l) => l.slug === slug);
  if (line) line.qty = Math.min(Math.max(1, Math.floor(qty)), MAX_QTY);
  writeBasket(lines);
}

export function removeFromBasket(slug: string): void {
  writeBasket(readBasket().filter((l) => l.slug !== slug));
}

export function clearBasket(): void {
  writeBasket([]);
}

export function basketCount(): number {
  return readBasket().reduce((n, l) => n + l.qty, 0);
}

export function onBasketChange(fn: () => void): void {
  window.addEventListener(CHANGE_EVENT, fn);
  // Also react to changes made in another tab.
  window.addEventListener('storage', (e) => {
    if (e.key === KEY || e.key === null) fn();
  });
}

/**
 * Wire up the header basket link: `[data-basket-link]` is hidden until
 * the basket has something in it; `[data-basket-count]` shows the count.
 */
export function bindBasketBadge(): void {
  const links = document.querySelectorAll<HTMLElement>('[data-basket-link]');
  if (links.length === 0) return;
  const update = () => {
    const n = basketCount();
    links.forEach((link) => {
      link.hidden = n === 0;
      const count = link.querySelector<HTMLElement>('[data-basket-count]');
      if (count) count.textContent = String(n);
    });
  };
  update();
  onBasketChange(update);
}

/**
 * Wire up `[data-add-to-basket="<slug>"]` buttons. After adding, the
 * button confirms briefly and a sibling `[data-added-note]` (if present)
 * is revealed with a link to the basket.
 */
export function bindAddToBasketButtons(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-add-to-basket]').forEach((button) => {
    const slug = button.dataset.addToBasket;
    if (!slug) return;
    const original = button.textContent;
    button.disabled = false;
    button.addEventListener('click', () => {
      addToBasket(slug, 1);
      button.textContent = 'Added to basket';
      button.classList.add('is-added');
      const note = button.parentElement?.querySelector<HTMLElement>('[data-added-note]');
      if (note) note.hidden = false;
      window.setTimeout(() => {
        button.textContent = original;
        button.classList.remove('is-added');
      }, 1600);
    });
  });
}
