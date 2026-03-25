/**
 * Design Lab — now powered by the <kaltrap-culator> library.
 * All calculator logic, themes, and widget rendering come from the custom element.
 * This file only handles the lab page's tab switching UI.
 */
import { registerKaltrapCulator } from '../src/register';

registerKaltrapCulator();

/* ─── Tab switching (lab page UI only) ─── */

const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('.lab__tab'));
const panels = Array.from(document.querySelectorAll<HTMLElement>('.lab__panel'));

tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
        tabs.forEach((t) => {
            t.classList.remove('lab__tab--active');
            t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('lab__tab--active');
        tab.setAttribute('aria-selected', 'true');

        const targetId = tab.getAttribute('aria-controls');
        panels.forEach((p) => {
            const isTarget = p.id === targetId;
            p.hidden = !isTarget;
            p.classList.toggle('lab__panel--hidden', !isTarget);
        });
    });
});
