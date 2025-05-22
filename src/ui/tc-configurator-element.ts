import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SlideTreeEntry } from '../models';

/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement('tc-configurator-element')
export class TcConfiguratorElement extends LitElement {
    @property()
    slides: SlideTreeEntry[] = [];

    @property()
    theme: string = '';

    @property()
    type: string = '';

    @property()
    i18n: string = '';

    render() {
        return html`
            <div class="ui-slide-selector-container">
                <div
                    id="ui-slide-selector-close"
                    @click="${() => this.closeUI()}">
                    ✖️
                </div>
                <h1>Slide selector</h1>
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
                <button @click="${() => this.applyConfiguration()}">
                    Validate selection
                </button>
                <div>TODO Print configuration</div>
                <span
                    >Close this window by pressing 'Escape', clicking on cross
                    or validating the selection</span
                >
            </div>
        `;
    }

    private onSlideSelected(e: CustomEvent) {
        this.slides = e.detail;
        //this.slides = e.detail;
        this.requestUpdate();
    }

    private closeUI() {
        this.dispatchEvent(new CustomEvent('close-ui', { bubbles: true }));
    }

    /**
     * Handler method that deals with the apply button. it will refresh the page
     */
    applyConfiguration() {
        // Construct the url
        let newUrl = '';
        const addUrl = (url: string, key: string, value: string) =>
            value && url
                ? `${url}&${key}=${value}`
                : value
                  ? `${url}?${key}=${value}`
                  : url;

        newUrl = addUrl(newUrl, 'theme', this.theme);
        newUrl = addUrl(newUrl, 'data-lang', this.i18n);
        newUrl = addUrl(newUrl, 'type', this.type);

        // Apply the new url
        history.pushState(
            { theme: this.theme, language: this.i18n, type: this.type },
            '',
            newUrl
        );
        history.go(0);
    }

    static styles = css`
        :host {
        }

        .ui-slide-selector-container {
            position: absolute;
            width: 100%;
            height: 100%;

            z-index: 100;

            font-family: monospace;
            display: grid;
            grid-template-rows: 50px 1fr 50px 150px 100px 20px;
            grid-template-columns: 1fr;

            #ui-slide-selector-close {
                position: absolute;
                top: 15px;
                right: 15px;
                cursor: pointer;
                font-size: 1.5em;
            }

            h1 {
                text-align: center;
                justify-self: center;
            }

            .slide-selector {
                overflow-y: auto;
            }
            ul {
                list-style-type: none;
            }
            li {
                margin: 10px;
            }

            div.modes {
                align-self: center;
                text-align: center;
                padding: 50px;
            }

            button {
                width: 150px;
                justify-self: center;
                margin: 20px;
            }
            span {
                text-align: center;
            }
        }
    `;
}

declare global {
    interface HTMLElementTagNameMap {
        'tc-configurator-element': TcConfiguratorElement;
    }
}
