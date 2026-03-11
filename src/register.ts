import { KaltrapCulatorElement } from "./components/kaltrapculator-element";

export const KALTRAP_TAG_NAME = "kaltrap-culator";

export function registerKaltrapCulator(tagName = KALTRAP_TAG_NAME) {
    if (!customElements.get(tagName)) {
        customElements.define(tagName, KaltrapCulatorElement);
    }
}
