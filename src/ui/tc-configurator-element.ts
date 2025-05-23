import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SlideTreeEntry } from '../models.js';

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

    @property()
    revealOptions: object = {};

    private selectedTab: string = 'talk-control';

    constructor() {
        super();
        this.slides = [];
        this.theme = '';
        this.i18n = '';
        this.type = '';
        this.revealOptions = {};
    }

    render() {
        return html`
            <div class="ui-slide-selector-container">
                <div
                    id="ui-slide-selector-close"
                    @click="${() => this.closeUI()}">
                    ✖️
                </div>
                <h1>Talk Control - Configurator</h1>
                <div class="tabs">
                    <button
                        @click="${() => this.selectTab('talk-control')}"
                        class="tab-button ${this.selectedTab === 'talk-control'
                            ? 'active'
                            : ''}">
                        Talk Control
                    </button>
                    <button
                        @click="${() => this.selectTab('revealjs')}"
                        class="tab-button ${this.selectedTab === 'revealjs'
                            ? 'active'
                            : ''}">
                        RevealJS
                    </button>
                </div>
                <div class="tab-content">
                    ${this.selectedTab === 'talk-control'
                        ? html`<tc-talk-control-element
                              .slides="${this.slides}"
                              .theme="${this.theme}"
                              .i18n="${this.i18n}"
                              .type="${this.type}">
                          </tc-talk-control-element>`
                        : html`<tc-revealjs-element
                              .revealOptions="${this.revealOptions}">
                          </tc-revealjs-element>`}
                </div>
                <button id="applyChange" @click="${() => this.applyChanges()}">
                    Apply Changes
                </button>
                <span
                    >Close this window by pressing 'Escape', clicking on cross
                    or validating the selection</span
                >
            </div>
        `;
    }

    selectTab(tab: string) {
        this.selectedTab = tab;
        this.requestUpdate();
    }

    applyChanges() {
        // Logique pour appliquer les changements
        console.log(
            'Applying changes:',
            this.slides,
            this.theme,
            this.i18n,
            this.type,
            this.revealOptions
        );
    }

    closeUI() {
        // Logique pour fermer l'interface utilisateur
        console.log('Closing UI');
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
            grid-template-rows: 50px auto 1fr 70px 50px;
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
                margin-bottom: 20px;
            }

            .slide-selector {
                overflow-y: auto;
                max-height: 300px;
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
                padding: 20px;
            }

            button {
                padding: 8px 15px;
                cursor: pointer;
                border: 1px solid #ddd;
                background-color: #f8f8f8;
                border-radius: 4px;
                font-size: 14px;
                transition: all 0.2s ease;
            }

            button:hover {
                background-color: #e8e8e8;
                border-color: #ccc;
            }

            button:active {
                background-color: #ddd;
                transform: translateY(1px);
            }

            #applyChange {
                width: 180px;
                justify-self: center;
                margin: 20px auto;
                padding: 10px 20px;
            }

            span {
                text-align: center;
            }

            .tabs {
                display: flex;
                border-bottom: 2px solid #ddd;
                justify-content: center;
            }

            .tab-button {
                padding: 10px 25px;
                cursor: pointer;
                border: 1px solid #ddd;
                border-bottom: none;
                border-radius: 6px 6px 0 0;
                background-color: #f5f5f5;
                margin: 0 5px;
                margin-bottom: -2px;
                font-weight: bold;
                transition:
                    background-color 0.3s,
                    color 0.3s;
                position: relative;
                top: 2px;
            }

            .tab-button.active,
            .tab-button:hover {
                background-color: #fff;
                border-bottom: 2px solid #fff;
            }

            .tab-button.active {
                border-top: 3px solid #4285f4;
                padding-top: 8px;
            }

            .tab-content {
                display: flex;
                flex-direction: column;
                overflow: auto;
                padding: 20px;
                border: 1px solid #ddd;
                border-top: none;
                border-radius: 0 0 4px 4px;
                max-height: 60vh;
            }

            /* Style pour le bouton principal "Apply Changes" */
            .ui-slide-selector-container > button {
                width: 180px;
                justify-self: center;
                margin: 20px auto;
                padding: 10px 20px;
                background-color: #4285f4;
                color: white;
                border: none;
                border-radius: 4px;
                font-weight: bold;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }

            .ui-slide-selector-container > button:hover {
                background-color: #3367d6;
            }
        }
    `;
}

declare global {
    interface HTMLElementTagNameMap {
        'tc-configurator-element': TcConfiguratorElement;
    }
}
