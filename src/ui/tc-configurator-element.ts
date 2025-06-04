import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { SlideTreeEntry } from '../models.js';

@customElement('tc-configurator-element')
export class TcConfiguratorElement extends LitElement {
    static shadowRootOptions = {
        ...LitElement.shadowRootOptions,
        delegatesFocus: true,
    };

    @property({ type: Array })
    slides: SlideTreeEntry[] = [];

    @property({ type: String })
    theme: string = '';
    @property({ type: String })
    defaultTheme: string = '';

    @property({ type: String })
    type: string = '';
    @property({ type: String })
    defaultType: string = '';

    @property({ type: String })
    i18n: string = '';
    @property({ type: String })
    defaultI18n: string = '';

    @property({ type: Object })
    revealOptions: Record<string, unknown> = {};

    @state()
    private selectedTab: 'talk-control' | 'revealjs' = 'talk-control';
    @state() private isApplying = false;

    render() {
        return html`
            <div
                class="ui-slide-selector-container"
                role="dialog"
                aria-modal="true"
                aria-labelledby="configurator-title">
                <button
                    id="ui-slide-selector-close"
                    @click="${() => this.closeUI()}"
                    type="button"
                    aria-label="Close configurator"
                    @keydown="${this.handleCloseKeydown}">
                    <span aria-hidden="true">✖️</span>
                </button>
                <h1 id="configurator-title">Talk Control - Configurator</h1>
                <nav
                    class="tabs"
                    role="tablist"
                    aria-label="Configuration sections">
                    <button
                        type="button"
                        role="tab"
                        aria-selected="${this.selectedTab === 'talk-control'}"
                        aria-controls="talk-control-panel"
                        id="talk-control-tab"
                        tabindex="${this.selectedTab === 'talk-control'
                            ? '0'
                            : '-1'}"
                        @click="${() => this.selectTab('talk-control')}"
                        @keydown="${this.handleTabKeydown}"
                        class="tab-button ${this.selectedTab === 'talk-control'
                            ? 'active'
                            : ''}">
                        Talk Control
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected="${this.selectedTab === 'revealjs'}"
                        aria-controls="revealjs-panel"
                        id="revealjs-tab"
                        tabindex="${this.selectedTab === 'revealjs'
                            ? '0'
                            : '-1'}"
                        @click="${() => this.selectTab('revealjs')}"
                        @keydown="${this.handleTabKeydown}"
                        class="tab-button ${this.selectedTab === 'revealjs'
                            ? 'active'
                            : ''}">
                        RevealJS
                    </button>
                </nav>
                <div class="tab-content">
                    <div
                        role="tabpanel"
                        id="talk-control-panel"
                        aria-labelledby="talk-control-tab"
                        ?hidden="${this.selectedTab !== 'talk-control'}">
                        ${this.selectedTab === 'talk-control'
                            ? html`<tc-talk-control-element
                                  .slides="${this.slides}"
                                  .theme="${this.theme}"
                                  .defaultTheme="${this.defaultTheme}"
                                  .i18n="${this.i18n}"
                                  .defaultI18n="${this.defaultI18n}"
                                  .type="${this.type}"
                                  .defaultType="${this.defaultType}"
                                  @config-changed="${this.onConfigChanged}">
                              </tc-talk-control-element>`
                            : ''}
                    </div>
                    <div
                        role="tabpanel"
                        id="revealjs-panel"
                        aria-labelledby="revealjs-tab"
                        ?hidden="${this.selectedTab !== 'revealjs'}">
                        ${this.selectedTab === 'revealjs'
                            ? html`<tc-revealjs-element
                                  .revealOptions="${this.revealOptions}">
                              </tc-revealjs-element>`
                            : ''}
                    </div>
                </div>
                <button
                    id="applyChange"
                    type="button"
                    ?disabled="${this.isApplying}"
                    @click="${() => this.applyConfiguration()}"
                    aria-describedby="apply-description">
                    ${this.isApplying ? 'Applying...' : 'Apply Changes'}
                </button>
                <p id="apply-description" class="instructions">
                    Close this window by pressing 'Escape', clicking on cross or
                    validating the selection
                </p>
            </div>
        `;
    }

    selectTab(tab: 'talk-control' | 'revealjs') {
        if (this.selectedTab === tab) return;
        this.selectedTab = tab;

        this.updateComplete.then(() => {
            const selectedTabButton = this.shadowRoot?.querySelector(
                `#${tab}-tab`
            ) as HTMLElement;
            selectedTabButton?.focus();
        });
    }

    private handleTabKeydown(event: KeyboardEvent) {
        const tabs = ['talk-control', 'revealjs'] as const;
        const currentIndex = tabs.indexOf(this.selectedTab);

        switch (event.key) {
            case 'ArrowLeft':
            case 'ArrowUp': {
                event.preventDefault();
                const prevIndex =
                    currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
                this.selectTab(tabs[prevIndex]);
                break;
            }
            case 'ArrowRight':
            case 'ArrowDown': {
                event.preventDefault();
                const nextIndex =
                    currentIndex === tabs.length - 1 ? 0 : currentIndex + 1;
                this.selectTab(tabs[nextIndex]);
                break;
            }
            case 'Home':
                event.preventDefault();
                this.selectTab(tabs[0]);
                break;
            case 'End':
                event.preventDefault();
                this.selectTab(tabs[tabs.length - 1]);
                break;
        }
    }

    private handleCloseKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.closeUI();
        }
    }

    private onConfigChanged = (e: CustomEvent) => {
        const { theme, i18n, type } = e.detail;

        this.theme = theme;
        this.i18n = i18n;
        this.type = type;
    };

    /**
     * Handler method that deals with the apply button. it will refresh the page
     */
    applyConfiguration() {
        if (this.isApplying) return;
        try {
            this.isApplying = true;
            // Construct the url
            const newUrl = this.buildConfigurationUrl();

            // Apply the new url
            history.pushState(
                { theme: this.theme, language: this.i18n, type: this.type },
                '',
                newUrl
            );
            window.location.reload();
        } catch (error) {
            console.error('Error applying configuration:', error);
        } finally {
            this.isApplying = false;
        }
    }

    private buildConfigurationUrl(): string {
        const params = new URLSearchParams();

        if (this.theme) params.set('data-theme', this.theme);
        if (this.i18n) params.set('data-lang', this.i18n);
        if (this.type) params.set('data-type', this.type);

        const queryString = params.toString();
        return queryString ? `?${queryString}` : '';
    }

    closeUI() {
        this.dispatchEvent(new CustomEvent('close-ui', { bubbles: true }));
    }

    static styles = css`
        :host {
            --tc-ui-font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI',
                Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue',
                sans-serif;
            --tc-ui-button-bg-color: #007acc;
            --tc-ui-button-text-color: white;
            --tc-ui-button-hover-bg-color: #005a9e;
            --tc-ui-button-active-bg-color: #004c87;
            --tc-ui-focus-color: #0066cc;
            --tc-ui-border-radius: 4px;
            --tc-ui-spacing-sm: 8px;
            --tc-ui-spacing-md: 16px;
            --tc-ui-spacing-lg: 24px;
            display: block;
            width: 100%;
            height: 100%;
        }

        .ui-slide-selector-container {
            position: relative;
            width: 100%;
            height: 100%;

            z-index: 100;

            font-family: var(--tc-ui-font-primary);
            display: grid;
            grid-template-rows: auto auto auto 1fr auto auto;
            padding: var(--tc-ui-spacing-lg);
            box-sizing: border-box;
            background: white;
            border-radius: var(--tc-ui-border-radius);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

            #ui-slide-selector-close {
                position: absolute;
                top: var(--tc-ui-spacing-md);
                right: var(--tc-ui-spacing-md);
                background: transparent;
                border: none;
                font-size: 1.5em;
                cursor: pointer;
                padding: var(--tc-ui-spacing-sm);
                border-radius: var(--tc-ui-border-radius);
                transition: background-color 0.2s ease;
                &:hover {
                    background-color: rgba(0, 0, 0, 0.1);
                }

                &:focus-visible {
                    outline: 2px solid var(--tc-ui-focus-color);
                    outline-offset: 2px;
                }
            }

            h1 {
                text-align: center;
                margin: var(--tc-ui-spacing-md);
                color: #333;
                font-size: 1.5rem;
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
                background: var(--tc-ui-button-bg-color);
                color: var(--tc-ui-button-text-color);
                border: none;
                border-radius: 4px;
                font-size: 14px;
                transition: all 0.2s ease;
            }

            button:hover {
                background: var(--tc-ui-button-hover-bg-color);
            }

            button:active {
                background: var(--tc-ui-button-active-bg-color);
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
                gap: var(--tc-ui-spacing-sm);
            }

            .tab-button {
                padding: var(--tc-ui-spacing-md) var(--tc-ui-spacing-lg);
                border: 1px solid #ddd;
                border-bottom: none;
                border-radius: var(--tc-ui-border-radius)
                    var(--tc-ui-border-radius) 0 0;
                background-color: #f5f5f5;
                color: #666;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
                top: 2px;
            }

            .tab-button.active,
            .tab-button:hover {
                background-color: #e9e9e9;
                color: #333;
                border-bottom: 2px solid #fff;
            }

            .tab-button.active {
                border-top: 3px solid #4285f4;
                padding-top: 8px;
            }

            .tab-button:focus-visible {
                outline: 2px solid var(--tc-ui-focus-color);
                outline-offset: -2px;
            }
            .tab-button[aria-selected='true'] {
                background-color: white;
                color: #333;
                border-bottom: 2px solid white;
                border-top: 3px solid #4285f4;
                font-weight: 600;
            }

            .tab-content {
                overflow: auto;
                border: 1px solid #ddd;
                border-top: none;
                border-radius: 0 0 var(--tc-ui-border-radius)
                    var(--tc-ui-border-radius);
                background: white;
            }

            .tab-content > div[role='tabpanel'] {
                padding: var(--tc-ui-spacing-lg);
            }

            button {
                padding: var(--tc-ui-spacing-md) var(--tc-ui-spacing-lg);
                border: none;
                border-radius: var(--tc-ui-border-radius);
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                background: var(--tc-ui-button-bg-color);
                color: var(--tc-ui-button-text-color);
            }

            button:hover:not(:disabled) {
                background: var(--tc-ui-button-hover-bg-color);
                transform: translateY(-1px);
            }

            button:active:not(:disabled) {
                background: var(--tc-ui-button-active-bg-color);
                transform: translateY(0);
            }

            button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }

            button:focus-visible {
                outline: 2px solid var(--tc-ui-focus-color);
                outline-offset: 2px;
            }

            #applyChange {
                justify-self: center;
                padding: var(--tc-ui-spacing-md) var(--tc-ui-spacing-lg);
                background-color: #4285f4;
                color: white;
                font-weight: 600;
                box-shadow: 0 2px 8px rgba(66, 133, 244, 0.3);
                min-width: 180px;
            }

            #applyChange:hover:not(:disabled) {
                background-color: #3367d6;
                box-shadow: 0 4px 12px rgba(66, 133, 244, 0.4);
            }

            .instructions {
                text-align: center;
                margin: 0;
                color: #666;
                font-size: 0.9rem;
                line-height: 1.4;
            }

            [hidden] {
                display: none !important;
            }

            .tab-content > div[role='tabpanel'] {
                animation: fadeIn 0.2s ease-in-out;
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(8px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            *:focus-visible {
                outline: 2px solid var(--tc-ui-focus-color);
                outline-offset: 2px;
            }
        }
    `;
}

declare global {
    interface HTMLElementTagNameMap {
        'tc-configurator-element': TcConfiguratorElement;
    }
}
