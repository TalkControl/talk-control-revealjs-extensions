import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

interface ShortcutConfig {
    keys: string;
    description: string;
    editable?: boolean;
}

interface RevealConfig {
    navigationMode?: 'linear' | 'grid';
}

@customElement('tc-revealjs-element')
export class TcRevealjsElement extends LitElement {
    @property({ type: Object })
    revealOptions: RevealConfig = { navigationMode: 'grid' };

    @state()
    private shortcuts: Record<string, ShortcutConfig> = {};

    // Edit shortcut (will do it later to manage display correctly)
    @state()
    private editMode = false;

    static styles = css`
        :host {
            display: block;
            font-family: var(--tc-ui-font-primary);
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            --tc-ui-button-bg-color: #007acc;
            --tc-ui-button-text-color: white;
            --tc-ui-button-hover-bg-color: #005a9e;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .edit-toggle {
            background: #007acc;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }

        .edit-toggle:hover {
            background: #005a9e;
        }

        .shortcuts-container {
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
        }

        .shortcut-item {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            border-bottom: 1px solid #eee;
            gap: 16px;
        }

        .shortcut-item:last-child {
            border-bottom: none;
        }

        .shortcut-keys {
            min-width: 200px;
            font-family: 'Courier New', monospace;
            background: #f5f5f5;
            padding: 4px 8px;
            border-radius: 4px;
            border: 1px solid transparent;
        }

        .shortcut-keys.editable {
            border-color: #007acc;
            background: white;
            outline: none;
        }

        .shortcut-description {
            flex: 1;
            color: #333;
        }

        .navigation-mode {
            margin-bottom: 20px;
            padding: 12px;
            border-radius: 4px;
        }

        .navigation-mode label {
            margin-right: 16px;
            cursor: pointer;
        }

        .button-footer {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-top: 20px;
            padding: 10px 0;
            background-color: #f8f9fa;
            border-top: 1px solid #ddd;

            button {
                background: var(--tc-ui-button-bg-color);
                color: var(--tc-ui-button-text-color);
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                margin: 0 5px;
                transition: background 0.3s ease;
            }
            button:hover {
                background: var(--tc-ui-button-hover-bg-color);
            }
            button:active {
                background: var(--tc-ui-button-active-bg-color);
                transform: translateY(1px);
            }
            .save-button {
                background: #28a745;
                color: white;
                margin-left: 8px;
            }

            .save-button:hover {
                background: #218838;
            }
        }

        .button-footer .edit-toggle {
            margin-left: auto;
        }
    `;

    protected firstUpdated() {
        this.revealOptions = { navigationMode: 'grid' };
        this.updateShortcuts();
    }

    protected updated(
        changedProperties: Map<string | number | symbol, unknown>
    ) {
        if (changedProperties.has('revealOptions')) {
            this.updateShortcuts();
        }
    }

    private updateShortcuts() {
        const config = this.revealOptions;
        const shortcuts: Record<string, ShortcutConfig> = {};

        // Shortcut according to navigation mode
        if (config.navigationMode === 'linear') {
            shortcuts['next'] = {
                keys: '→ , ↓ , SPACE , N , L , J',
                description: 'Next slide',
                editable: true,
            };
            shortcuts['prev'] = {
                keys: '← , ↑ , P , H , K',
                description: 'Previous slide',
                editable: true,
            };
        } else {
            shortcuts['next'] = {
                keys: 'N , SPACE',
                description: 'Next slide',
                editable: true,
            };
            shortcuts['prev'] = {
                keys: 'P , Shift SPACE',
                description: 'Previous slide',
                editable: true,
            };
            shortcuts['left'] = {
                keys: '← , H',
                description: 'Navigate left',
                editable: true,
            };
            shortcuts['right'] = {
                keys: '→ , L',
                description: 'Navigate right',
                editable: true,
            };
            shortcuts['up'] = {
                keys: '↑ , K',
                description: 'Navigate up',
                editable: true,
            };
            shortcuts['down'] = {
                keys: '↓ , J',
                description: 'Navigate down',
                editable: true,
            };
        }

        // commun shortcut
        shortcuts['altNav'] = {
            keys: 'Alt + ←/↑/→/↓',
            description: 'Navigate without fragments',
            editable: true,
        };
        shortcuts['jumpSlide'] = {
            keys: 'Shift + ←/↑/→/↓',
            description: 'Jump to first/last slide',
            editable: true,
        };
        shortcuts['pause'] = {
            keys: 'B , .',
            description: 'Pause',
            editable: true,
        };
        shortcuts['fullscreen'] = {
            keys: 'F',
            description: 'Fullscreen',
            editable: true,
        };
        shortcuts['jumpTo'] = {
            keys: 'G',
            description: 'Jump to slide',
            editable: true,
        };
        shortcuts['overview'] = {
            keys: 'ESC, O',
            description: 'Slide overview',
            editable: true,
        };
        shortcuts['tc-control'] = {
            keys: 'C',
            description: 'Show talk-control UI',
            editable: false,
        };

        this.shortcuts = shortcuts;
    }

    private handleNavigationModeChange(event: Event) {
        const target = event.target as HTMLInputElement;
        this.revealOptions = {
            ...this.revealOptions,
            navigationMode: target.value as 'linear' | 'grid',
        };

        this.dispatchEvent(
            new CustomEvent('reveal-options-changed', {
                detail: { revealOptions: this.revealOptions },
                bubbles: true,
            })
        );
    }

    private handleShortcutChange(shortcutId: string, newKeys: string) {
        this.shortcuts = {
            ...this.shortcuts,
            [shortcutId]: {
                ...this.shortcuts[shortcutId],
                keys: newKeys,
            },
        };
    }

    /*
    private toggleEditMode() {
        this.editMode = !this.editMode;
    }

    private saveChanges() {
        this.editMode = false;

        this.dispatchEvent(
            new CustomEvent('shortcuts-changed', {
                detail: { shortcuts: this.shortcuts },
                bubbles: true,
            })
        );
    }*/

    render() {
        return html`
            <div class="navigation-mode">
                <h3>Navigation Mode</h3>
                <label>
                    <input
                        type="radio"
                        name="navigationMode"
                        value="grid"
                        .checked=${this.revealOptions.navigationMode === 'grid'}
                        @change=${this.handleNavigationModeChange} />
                    Grid (2D navigation)
                </label>
                <label>
                    <input
                        type="radio"
                        name="navigationMode"
                        value="linear"
                        .checked=${this.revealOptions.navigationMode ===
                        'linear'}
                        @change=${this.handleNavigationModeChange} />
                    Linear (1D navigation)
                </label>
            </div>

            <div
                class="shortcuts-container"
                role="table"
                aria-label="Keyboard shortcuts">
                ${Object.entries(this.shortcuts).map(
                    ([id, shortcut]) => html`
                        <div class="shortcut-item" role="row">
                            ${this.editMode && shortcut.editable
                                ? html`
                                      <input
                                          class="shortcut-keys editable"
                                          .value=${shortcut.keys}
                                          @input=${(e: Event) =>
                                              this.handleShortcutChange(
                                                  id,
                                                  (e.target as HTMLInputElement)
                                                      .value
                                              )}
                                          aria-label="Edit shortcut keys for ${shortcut.description}" />
                                  `
                                : html`
                                      <span class="shortcut-keys" role="cell">
                                          ${shortcut.keys}
                                      </span>
                                  `}
                            <span class="shortcut-description" role="cell">
                                ${shortcut.description}
                            </span>
                        </div>
                    `
                )}
            </div>

            ${this.renderFooterEdit()}
        `;
    }

    renderFooterEdit() {
        return html``;
        /*
        return html`
        <footer class="button-footer">
                <div>
                    <button
                        class="edit-toggle"
                        @click=${this.toggleEditMode}
                        aria-label="${this.editMode
                            ? 'Exit edit mode'
                            : 'Enter edit mode'}">
                        ${this.editMode ? 'Cancel' : 'Edit Shortcuts'}
                    </button>
                    ${this.editMode
                        ? html`
                              <button
                                  class="save-button"
                                  @click=${this.saveChanges}
                                  aria-label="Save changes">
                                  Save
                              </button>
                          `
                        : ''}
                </div>
            </footer>`;*/
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'tc-revealjs-element': TcRevealjsElement;
    }
}
