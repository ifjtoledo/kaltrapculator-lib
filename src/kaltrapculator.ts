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
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }

        .claptrap-body {
          background: #4A4B4E;
          border: 4px solid var(--clap-border);
          border-radius: 12px;
          padding: 20px;
          position: relative;
          box-shadow: 8px 8px 0px var(--clap-border); /* Efecto Cartoon */
          width: 280px;
          overflow: hidden;
        }

        /* La franja blanca icónica */
        .claptrap-body::before {
          content: '';
          position: absolute;
          top: 40%;
          left: 0;
          width: 100%;
          height: 40px;
          background: var(--clap-white);
          border-top: 4px solid var(--clap-border);
          border-bottom: 4px solid var(--clap-border);
          z-index: 0;
          opacity: 0.8;
        }

        .screen {
          background: #2d2d2d;
          color: #333;
          padding: 15px;
          border: 4px solid var(--clap-border);
          border-radius: 4px;
          text-align: right;
          font-size: 1.5rem;
          margin-bottom: 20px;
          position: relative;
          z-index: 1;
          box-shadow: inset 0 4px 0 rgba(0,0,0,0.5);
          min-height: 1.5em;
        }

        /* El ojito azul de Claptrap */
        .eye-indicator {
          width: 15px;
          height: 15px;
          background: var(--clap-blue-eye);
          border: 3px solid var(--clap-border);
          border-radius: 50%;
          position: absolute;
          top: 10px;
          right: 10px;
          box-shadow: 0 0 10px var(--clap-blue-eye);
          z-index: 2;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          position: relative;
          z-index: 1;
        }

        button {
          background: var(--clap-white);
          border: 3px solid var(--clap-border);
          padding: 12px;
          font-weight: bold;
          cursor: pointer;
          border-radius: 4px;
          transition: transform 0.1s;
          box-shadow: 3px 3px 0px var(--clap-border);
        }

        button:active {
          transform: translate(2px, 2px);
          box-shadow: 1px 1px 0px var(--clap-border);
        }

        .btn-op { background: #ff9f43; }
        .btn-equal { 
            background: var(--clap-blue-eye); 
            grid-column: span 2; 
        }
      </style>

      <div class="claptrap-body">
        <div class="eye-indicator"></div>
        <div class="screen">0</div>
        
        <div class="grid">
          <button>7</button><button>8</button><button>9</button><button class="btn-op">÷</button>
          <button>4</button><button>5</button><button>6</button><button class="btn-op">×</button>
          <button>1</button><button>2</button><button>3</button><button class="btn-op">-</button>
          <button>0</button><button>.</button><button class="btn-equal">=</button>
        </div>
      </div>
    `;
    }

}