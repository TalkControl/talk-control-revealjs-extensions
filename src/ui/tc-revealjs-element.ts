import { LitElement, html /*, css */ } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('tc-revealjs-element')
export class TcRevealjsElement extends LitElement {
    @property()
    revealOptions: object = {};

    render() {
        return html`
            <h1>RevealJS Options</h1>
            <div class="reveal-options"></div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'tc-revealjs-element': TcRevealjsElement;
    }
}
