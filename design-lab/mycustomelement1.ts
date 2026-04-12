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
        throw new Error('Method not implemented.');
    }
    openmandias(): void {
        throw new Error('Method not implemented.');
    }
    closemandias(): void {
        throw new Error('Method not implemented.');
    }
}