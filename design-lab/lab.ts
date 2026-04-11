/**
 * Design Lab — now powered by the <kaltrap-culator> library.
 * All calculator logic, themes, and widget rendering come from the custom element.
 * This file only handles the lab page's tab switching UI.
 */
import { registerKaltrapCulator } from '../src/register';

registerKaltrapCulator();

/* ═══════════════════════════════════════════════════════════
   TUTORIAL WEB COMPONENTS — Lección 1: Tu primer Custom Element
   ═══════════════════════════════════════════════════════════ */

/**
 * PASO 1: Crear una clase que extienda HTMLElement.
 *
 * ¿Por qué HTMLElement? Porque TODOS los tags HTML (<div>, <span>, <input>...)
 * son instancias de HTMLElement. Al extenderlo, tu clase hereda todo lo que
 * un elemento HTML sabe hacer: atributos, eventos, estar en el DOM, etc.
 */
class HolaMundoElement extends HTMLElement {

    /**
     * PASO 2: connectedCallback()
     *
     * Este método lo llama el navegador AUTOMÁTICAMENTE cuando tu tag
     * <hola-mundo> se inserta en la página (el DOM).
     *
     * Piénsalo así:
     *   - constructor()         → "nací" (pero aún no estoy en la página)
     *   - connectedCallback()   → "me pegaron en la página, ya puedo mostrar cosas"
     *
     * Aquí es donde pones el HTML que quieres que se vea.
     */
    connectedCallback() {
        this.innerHTML = `
            <div style="padding: 16px; border: 2px dashed #4caf50; border-radius: 8px; margin: 8px 0; font-family: sans-serif;">
                <strong style="color: #4caf50;">¡Hola, Web Components!</strong>
                <p style="margin: 8px 0 0; color: #ccc; font-size: 14px;">
                    Soy un Custom Element. Mi tag es <code>&lt;hola-mundo&gt;</code>.<br>
                    Fui definido en <code>lab.ts</code> con <code>customElements.define()</code>.
                </p>
            </div>
        `;
    }
}

/**
 * PASO 3: Registrar el componente.
 *
 * customElements.define() le dice al navegador:
 *   "Cuando veas el tag <hola-mundo> en el HTML, usa esta clase para darle vida."
 *
 * REGLA IMPORTANTE: El nombre del tag DEBE tener un guion (-).
 *   ✅ hola-mundo, mi-boton, user-card
 *   ❌ holamundo, boton, div2
 *
 * ¿Por qué? Para que el navegador distinga tus tags de los nativos (div, span, input...).
 */
customElements.define('hola-mundo', HolaMundoElement);

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
