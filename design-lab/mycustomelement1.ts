interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
}
interface ModaleteAPI {
    confirmandias(optionmandias: ConfirmOptions): Promise<boolean>;
    openmandias(): void;
    closemandias(): void;
}

class ModaleteUi extends HTMLElement implements ModaleteAPI {
    private shadowmandias: ShadowRoot;
    private resolvermandias?: (value: boolean) => void;
    private controllermandias = new AbortController();
    constructor() {
        super();
        this.shadowmandias = this.attachShadow({ mode: 'open' });
    }
    connectedCallback(): void {
        this.renderShellmandias();
        this.bindEventsmandias();
        this.bindKeyboardmandias();
    }
    confirmandias(optionmandias: ConfirmOptions): Promise<boolean> {
        this.fillContentmandias(optionmandias);
        this.openmandias();

        return new Promise<boolean>((resolvemandias) => {
            this.resolvermandias = resolvemandias;
        });
    }
    openmandias(): void {
        this.setAttribute('open', '');
        const backdropmandias = this.shadowmandias.querySelector<HTMLElement>('.modal-backdropmandias');
        if (backdropmandias) backdropmandias.style.display = 'flex';
    }

    closemandias(): void {
        this.removeAttribute('open');
        const backdropmandias = this.shadowmandias.querySelector<HTMLElement>('.modal-backdropmandias');
        if (backdropmandias) backdropmandias.style.display = 'none';
    }
    private renderShellmandias(): void {
        this.shadowmandias.innerHTML = `
        <style>
            .modal-backdropmandias {
                display:         none;
                position:        fixed;
                inset:           0;
                background:      rgba(0, 0, 0, 0.6);
                justify-content: center;
                align-items:     center;
                z-index:         1000;
            }
            .modalmandias {
                background:    var(--bg-2);
                border:        1px solid var(--clap-border);
                border-radius: var(--radius-md);
                padding:       var(--space-lg);
                width:         min(360px, 90vw);
                font-family:   var(--font-ui);
            }
            .modalmandias__title {
                margin:      0 0 var(--space-sm) 0;
                font-size:   1.1rem;
                font-weight: 700;
                color:       var(--clap-white);
            }
            .modalmandias__message {
                margin:      0 0 var(--space-md) 0;
                font-size:   0.9rem;
                color:       var(--text);
                line-height: 1.5;
            }
            .modalmandias__actions {
                display:         flex;
                justify-content: flex-end;
                gap:             var(--space-xs);
            }
            .modalmandias__btn {
                padding:       10px 20px;
                border:        none;
                border-radius: var(--radius-sm);
                font-family:   var(--font-ui);
                font-size:     0.875rem;
                font-weight:   600;
                cursor:        pointer;
            }
            .modalmandias__btn--confirm {
                background: var(--clap-blue-eye);
                color:      var(--bg-1);
            }
            .modalmandias__btn--cancel {
                background: var(--panel);
                color:      var(--clap-white);
            }
        </style>

        <div class="modal-backdropmandias" role="dialog" aria-modal="true">
            <div class="modalmandias">
                <h2  class="modalmandias__title"   data-titlemandias></h2>
                <p   class="modalmandias__message" data-messagemandias></p>
                <div class="modalmandias__actions">
                    <button class="modalmandias__btn modalmandias__btn--cancel"  data-btn-cancelmandias></button>
                    <button class="modalmandias__btn modalmandias__btn--confirm" data-btn-confirmmandias></button>
                </div>
            </div>
        </div>
    `;
    }
    private fillContentmandias(optionmandias: ConfirmOptions): void {
        const titlemandias = this.shadowmandias.querySelector('[data-titlemandias]');
        const messagemandias = this.shadowmandias.querySelector('[data-messagemandias]');
        const btnConfirmmandias = this.shadowmandias.querySelector('[data-btn-confirmmandias]');
        const btnCancelmandias = this.shadowmandias.querySelector('[data-btn-cancelmandias]');

        if (titlemandias) titlemandias.textContent = optionmandias.title;
        if (messagemandias) messagemandias.textContent = optionmandias.message;
        if (btnConfirmmandias) btnConfirmmandias.textContent = optionmandias.confirmText ?? 'Confirmar';
        if (btnCancelmandias) btnCancelmandias.textContent = optionmandias.cancelText ?? 'Cancelar';
    }
    private bindEventsmandias(): void {
        this.shadowmandias.querySelector('[data-btn-confirmmandias]')?.addEventListener('click', () => this.handleConfirmmandias());
        this.shadowmandias.querySelector('[data-btn-cancelmandias]')?.addEventListener('click', () => this.handleCancelmandias());

    }

    private bindKeyboardmandias(): void {
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.key === 'Escape' && this.hasAttribute('open')) {
                this.handleCancelmandias();
            }
        },
            { signal: this.controllermandias.signal })
    }
    disconnectedCallback(): void {
        this.controllermandias.abort();
    }
    private handleConfirmmandias(): void {
        this.resolvermandias?.(true);
        this.cleanupmandias();
    }
    private handleCancelmandias(): void {
        this.resolvermandias?.(false);
        this.cleanupmandias();
    }

    private cleanupmandias(): void {
        this.resolvermandias = undefined;
        this.closemandias();
    }
}
customElements.define('modalete-ui', ModaleteUi);