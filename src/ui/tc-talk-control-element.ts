import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SlideTreeEntry } from '../models';

@customElement('tc-talk-control-element')
export class TcTalkControlElement extends LitElement {
    @property({ type: Array })
    slides: SlideTreeEntry[] = [];

    @property()
    theme: string = '';

    @property()
    type: string = '';

    @property()
    i18n: string = '';

    render() {
        return html`
            <h1>
                Slides selector (select the files you want to play, then click
                Apply)
            </h1>
            <div class="slide-selector">
                <tc-tree-slides-element
                    .slides="${this.slides}"
                    @slides-selected="${(e: CustomEvent) =>
                        this.onSlideSelected(e)}">
                </tc-tree-slides-element>
            </div>
            <h1>Modes (type / theme / language)</h1>
            <div class="modes">
                <label for="mode-theme">Theme</label>
                <input
                    type="text"
                    id="mode-theme"
                    placeholder="(empty default 'school')"
                    .value="${this.theme}" />
                <label for="mode-language">Language</label>
                <input
                    type="text"
                    id="mode-language"
                    placeholder="(empty default 'FR')"
                    .value="${this.i18n}" />
                <label for="mode-slides">Type</label>
                <input
                    type="text"
                    id="mode-type"
                    placeholder="(empty default 'prez')"
                    .value="${this.type}" />
            </div>
        `;
    }

    private onSlideSelected(e: CustomEvent) {
        this.slides = e.detail;
        this.requestUpdate();
    }

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
        }

        .slide-selector {
            overflow-y: auto;
            max-height: 400px;
            border: 1px solid #ddd;
            padding: 10px;
            margin-bottom: 20px;
            border-radius: 4px;
        }

        h1 {
            font-size: 1.2em;
            margin: 10px 0;
        }

        .modes {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 10px;
            align-items: center;
            padding: 10px;
        }

        label {
            font-weight: bold;
        }

        input {
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
    `;
}

declare global {
    interface HTMLElementTagNameMap {
        'tc-talk-control-element': TcTalkControlElement;
    }
}
