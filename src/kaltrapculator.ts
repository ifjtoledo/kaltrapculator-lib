export class KaltrapCulator extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }
    private render() {
        this.shadowRoot!.innerHTML = `
        <style>
        :host {
          display: inline-block;
          font-family: 'Courier New', monospace;
          background: #222;
          color: #eee;
          padding: 1rem;
          border-radius: 8px;
        }
      </style>
      <div>
        🏗️ KaltrapCulator Ready
      </div>
    `;
    }

}