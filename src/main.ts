import { KaltrapCulator } from "./kaltrapculator";
if (!customElements.get('kaltrap-culator')) {
    customElements.define('kaltrap-culator', KaltrapCulator);
}
export { KaltrapCulator };