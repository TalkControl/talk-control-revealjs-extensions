import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { SlideTreeEntry } from '../models';

@customElement('tc-talk-control-element')
export class TcTalkControlElement extends LitElement {
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

    @state() private validationErrors: Record<string, string> = {};
    @state() private isDirty = false;

    render() {
        return html`
            <div class="talk-control-container">
                <section
                    class="slides-section"
                    aria-labelledby="slides-heading">
                    <h2 id="slides-heading">
                        Slide Selection
                        <span class="help-text"
                            >Select the files you want to play, then click
                            Apply</span
                        >
                    </h2>

                    <div
                        class="slide-selector"
                        role="region"
                        aria-label="Slide tree selector">
                        <tc-tree-slides-element
                            .slides="${this.slides}"
                            @slides-selected="${this.onSlideSelected}">
                        </tc-tree-slides-element>
                    </div>
                </section>

                <section class="modes-section" aria-labelledby="modes-heading">
                    <h2 id="modes-heading">Configuration</h2>
                    <p class="section-description">
                        Configure theme, language and presentation type
                    </p>

                    <form
                        class="modes-form"
                        @input="${this.onFormInput}"
                        @change="${this.onFormChange}">
                        <!-- Theme -->
                        <div class="form-group">
                            <label for="mode-theme" class="form-label">
                                Theme
                                <span class="default-hint"
                                    >(default: ${this.defaultTheme})</span
                                >
                            </label>
                            <input
                                type="text"
                                id="mode-theme"
                                name="theme"
                                class="form-input ${this.validationErrors.theme
                                    ? 'error'
                                    : ''}"
                                placeholder="Enter theme name"
                                .value="${this.theme}"
                                @input="${this.onThemeInput}"
                                @blur="${this.validateTheme}"
                                aria-describedby="theme-help ${this
                                    .validationErrors.theme
                                    ? 'theme-error'
                                    : ''}"
                                autocomplete="off" />
                            <div id="theme-help" class="help-text">
                                Customize the visual theme of your presentation
                            </div>
                            ${this.validationErrors.theme
                                ? html`<div
                                      id="theme-error"
                                      class="error-message"
                                      role="alert">
                                      ${this.validationErrors.theme}
                                  </div>`
                                : ''}
                        </div>

                        <!-- Language -->
                        <div class="form-group">
                            <label for="mode-language" class="form-label">
                                Language
                                <span class="default-hint"
                                    >(default: ${this.defaultI18n})</span
                                >
                            </label>
                            <input
                                type="text"
                                id="mode-language"
                                name="i18n"
                                class="form-input ${this.validationErrors.i18n
                                    ? 'error'
                                    : ''}"
                                placeholder="Enter language code (e.g., FR, EN)"
                                .value="${this.i18n}"
                                @input="${this.onLanguageInput}"
                                @blur="${this.validateLanguage}"
                                aria-describedby="language-help ${this
                                    .validationErrors.i18n
                                    ? 'language-error'
                                    : ''}"
                                autocomplete="language"
                                pattern="[A-Za-z]{2,5}"
                                maxlength="5" />
                            <div id="language-help" class="help-text">
                                Set the presentation language (2-5 letter code)
                            </div>
                            ${this.validationErrors.i18n
                                ? html`<div
                                      id="language-error"
                                      class="error-message"
                                      role="alert">
                                      ${this.validationErrors.i18n}
                                  </div>`
                                : ''}
                        </div>

                        <!-- Type -->
                        <div class="form-group">
                            <label for="mode-type" class="form-label">
                                Presentation Type
                                <span class="default-hint"
                                    >(default: ${this.defaultType})</span
                                >
                            </label>
                            <input
                                type="text"
                                id="mode-type"
                                name="type"
                                class="form-input ${this.validationErrors.type
                                    ? 'error'
                                    : ''}"
                                placeholder="Enter presentation type"
                                .value="${this.type}"
                                @input="${this.onTypeInput}"
                                @blur="${this.validateType}"
                                aria-describedby="type-help ${this
                                    .validationErrors.type
                                    ? 'type-error'
                                    : ''}"
                                autocomplete="off" />
                            <div id="type-help" class="help-text">
                                Define the type of presentation (e.g., prez,
                                demo, tutorial)
                            </div>
                            ${this.validationErrors.type
                                ? html`<div
                                      id="type-error"
                                      class="error-message"
                                      role="alert">
                                      ${this.validationErrors.type}
                                  </div>`
                                : ''}
                        </div>
                    </form>
                </section>

                ${this.isDirty
                    ? html`<div
                          class="dirty-indicator"
                          role="status"
                          aria-live="polite">
                          <span class="dirty-icon">●</span>
                          Unsaved changes
                      </div>`
                    : ''}
            </div>
        `;
    }

    private onSlideSelected = (e: CustomEvent<SlideTreeEntry[]>) => {
        try {
            const selectedSlides = e.detail;

            if (!Array.isArray(selectedSlides)) {
                throw new Error('Invalid slides data received');
            }

            this.slides = selectedSlides;
            this.markAsDirty();

            this.dispatchEvent(
                new CustomEvent('slides-changed', {
                    detail: { slides: this.slides },
                    bubbles: true,
                    composed: true,
                })
            );
        } catch (error) {
            console.error('Error handling slide selection:', error);
            this.handleError('slides', 'Failed to update slide selection');
        }
    };

    private onThemeInput = (e: Event) => {
        const input = e.target as HTMLInputElement;
        this.theme = input.value.trim();
        this.markAsDirty();
        this.clearValidationError('theme');
        this.emitConfigChange();
    };

    private onLanguageInput = (e: Event) => {
        const input = e.target as HTMLInputElement;
        this.i18n = input.value.trim().toUpperCase();
        this.markAsDirty();
        this.clearValidationError('i18n');
        this.emitConfigChange();
    };

    private onTypeInput = (e: Event) => {
        const input = e.target as HTMLInputElement;
        this.type = input.value.trim();
        this.markAsDirty();
        this.clearValidationError('type');
        this.emitConfigChange();
    };

    private onFormInput = () => {
        this.markAsDirty();
    };

    private onFormChange = () => {
        this.validateForm();
    };

    private markAsDirty() {
        if (!this.isDirty) {
            this.isDirty = true;
        }
    }

    private emitConfigChange() {
        this.dispatchEvent(
            new CustomEvent('config-changed', {
                detail: {
                    theme: this.theme,
                    i18n: this.i18n,
                    type: this.type,
                    isValid: this.isFormValid(),
                },
                bubbles: true,
                composed: true,
            })
        );
    }

    /**
     * Validation du thème
     */
    private validateTheme = () => {
        if (!this.theme) return true;
        const theme = this.theme.trim();

        if (theme && !/^[a-zA-Z0-9-_]+$/.test(theme)) {
            this.setValidationError(
                'theme',
                'Theme name can only contain letters, numbers, hyphens and underscores'
            );
            return false;
        }

        this.clearValidationError('theme');
        return true;
    };

    /**
     * Validation de la langue
     */
    private validateLanguage = () => {
        if (!this.i18n) return true;
        const language = this.i18n.trim();

        if (language && !/^[A-Za-z]{2,5}$/.test(language)) {
            this.setValidationError(
                'i18n',
                'Language code must be 2-5 letters only'
            );
            return false;
        }

        this.clearValidationError('i18n');
        return true;
    };

    /**
     * Validation du type
     */
    private validateType = () => {
        if (!this.type) return true;
        const type = this.type.trim();

        if (type && !/^[a-zA-Z0-9-_]+$/.test(type)) {
            this.setValidationError(
                'type',
                'Type can only contain letters, numbers, hyphens and underscores'
            );
            return false;
        }

        this.clearValidationError('type');
        return true;
    };

    /**
     * Validation complète du formulaire
     */
    private validateForm(): boolean {
        return (
            this.validateTheme() &&
            this.validateLanguage() &&
            this.validateType()
        );
    }

    /**
     * Vérifier si le formulaire est valide
     */
    private isFormValid(): boolean {
        return Object.keys(this.validationErrors).length === 0;
    }

    /**
     * Définir une erreur de validation
     */
    private setValidationError(field: string, message: string) {
        this.validationErrors = {
            ...this.validationErrors,
            [field]: message,
        };
    }

    /**
     * Effacer une erreur de validation
     */
    private clearValidationError(field: string) {
        if (this.validationErrors[field]) {
            const { ...rest } = this.validationErrors;
            this.validationErrors = rest;
        }
    }

    /**
     * Gestion générale des erreurs
     */
    private handleError(field: string, message: string) {
        this.setValidationError(field, message);

        // Émettre un événement d'erreur
        this.dispatchEvent(
            new CustomEvent('validation-error', {
                detail: { field, message },
                bubbles: true,
                composed: true,
            })
        );
    }

    /**
     * Méthode publique pour réinitialiser le formulaire
     */
    public resetForm() {
        this.theme = '';
        this.i18n = '';
        this.type = '';
        this.validationErrors = {};
        this.isDirty = false;

        this.dispatchEvent(
            new CustomEvent('form-reset', {
                bubbles: true,
                composed: true,
            })
        );
    }

    /**
     * Méthode publique pour valider le formulaire
     */
    public validate(): boolean {
        return this.validateForm();
    }

    /**
     * Méthode publique pour obtenir la configuration actuelle
     */
    public getConfiguration() {
        return {
            theme: this.theme || this.defaultTheme,
            i18n: this.i18n || this.defaultI18n,
            type: this.type || this.defaultType,
            slides: this.slides,
            isValid: this.isFormValid(),
            isDirty: this.isDirty,
        };
    }

    /**
     * Gestion du focus initial
     */
    firstUpdated() {
        // Focus sur le premier champ de saisie
        const firstInput = this.shadowRoot?.querySelector(
            'input'
        ) as HTMLInputElement;
        firstInput?.focus();
    }

    static styles = css`
        :host {
            --tc-ui-font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI',
                Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue',
                sans-serif;
            --tc-ui-spacing-xs: 4px;
            --tc-ui-spacing-sm: 8px;
            --tc-ui-spacing-md: 16px;
            --tc-ui-spacing-lg: 24px;
            --tc-ui-spacing-xl: 32px;
            --tc-ui-border-radius: 6px;
            --tc-ui-border-color: #e1e5e9;
            --tc-ui-focus-color: #0066cc;
            --tc-ui-error-color: #d73a49;
            --tc-ui-success-color: #28a745;
            --tc-ui-text-primary: #24292e;
            --tc-ui-text-secondary: #586069;
            --tc-ui-text-muted: #6a737d;
            --tc-ui-bg-primary: #ffffff;
            --tc-ui-bg-secondary: #f6f8fa;

            display: block;
            font-family: var(--tc-ui-font-primary);
            color: var(--tc-ui-text-primary);
            line-height: 1.5;
        }

        .talk-control-container {
            max-width: 800px;
            margin: 0 auto;
            padding: var(--tc-ui-spacing-lg);
            display: flex;
            flex-direction: column;
            gap: var(--tc-ui-spacing-xl);
        }

        section {
            background: var(--tc-ui-bg-primary);
            border: 1px solid var(--tc-ui-border-color);
            border-radius: var(--tc-ui-border-radius);
            padding: var(--tc-ui-spacing-lg);
        }

        .slides-section {
            flex: 1;
            min-height: 300px;
        }

        .modes-section {
            flex-shrink: 0;
        }

        /* Titres */
        h2 {
            margin: 0 0 var(--tc-ui-spacing-md) 0;
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--tc-ui-text-primary);
            display: flex;
            align-items: center;
            gap: var(--tc-ui-spacing-sm);
        }

        .help-text {
            font-size: 0.875rem;
            font-weight: 400;
            color: var(--tc-ui-text-secondary);
        }

        .section-description {
            margin: 0 0 var(--tc-ui-spacing-lg) 0;
            color: var(--tc-ui-text-secondary);
            font-size: 0.9rem;
        }

        /* Sélecteur de slides */
        .slide-selector {
            overflow-y: auto;
            max-height: 400px;
            border: 1px solid var(--tc-ui-border-color);
            border-radius: var(--tc-ui-border-radius);
            background: var(--tc-ui-bg-secondary);
            padding: var(--tc-ui-spacing-md);
        }

        .slide-selector:focus-within {
            border-color: var(--tc-ui-focus-color);
            box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
        }

        /* Formulaire */
        .modes-form {
            display: flex;
            flex-direction: column;
            gap: var(--tc-ui-spacing-lg);
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: var(--tc-ui-spacing-xs);
        }

        .form-label {
            font-weight: 600;
            color: var(--tc-ui-text-primary);
            font-size: 0.875rem;
            display: flex;
            align-items: center;
            gap: var(--tc-ui-spacing-xs);
        }

        .default-hint {
            font-weight: 400;
            color: var(--tc-ui-text-muted);
            font-size: 0.8rem;
        }

        .form-input {
            padding: var(--tc-ui-spacing-sm) var(--tc-ui-spacing-md);
            border: 1px solid var(--tc-ui-border-color);
            border-radius: var(--tc-ui-border-radius);
            font-size: 0.875rem;
            font-family: inherit;
            background: var(--tc-ui-bg-primary);
            transition: all 0.2s ease;
            min-height: 20px;
        }

        .form-input:focus {
            outline: none;
            border-color: var(--tc-ui-focus-color);
            box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
        }

        .form-input:hover:not(:focus) {
            border-color: #c1c8cd;
        }

        .form-input.error {
            border-color: var(--tc-ui-error-color);
            box-shadow: 0 0 0 2px rgba(215, 58, 73, 0.1);
        }

        .form-input::placeholder {
            color: var(--tc-ui-text-muted);
        }

        /* Messages d'aide et d'erreur */
        .help-text {
            font-size: 0.8rem;
            color: var(--tc-ui-text-muted);
            line-height: 1.4;
        }

        .error-message {
            font-size: 0.8rem;
            color: var(--tc-ui-error-color);
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: var(--tc-ui-spacing-xs);
        }

        .error-message::before {
            content: '⚠️';
            font-size: 0.75rem;
        }

        /* Indicateur de modifications */
        .dirty-indicator {
            position: fixed;
            bottom: var(--tc-ui-spacing-lg);
            right: var(--tc-ui-spacing-lg);
            background: var(--tc-ui-focus-color);
            color: white;
            padding: var(--tc-ui-spacing-sm) var(--tc-ui-spacing-md);
            border-radius: var(--tc-ui-border-radius);
            font-size: 0.8rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: var(--tc-ui-spacing-xs);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        }

        .dirty-icon {
            color: #ffd700;
            font-size: 0.6rem;
            animation: pulse 2s infinite;
        }

        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes pulse {
            0%,
            100% {
                opacity: 1;
            }
            50% {
                opacity: 0.5;
            }
        }

        *:focus-visible {
            outline: 2px solid var(--tc-ui-focus-color);
            outline-offset: 2px;
        }

        /*

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
        }*/
    `;
}

declare global {
    interface HTMLElementTagNameMap {
        'tc-talk-control-element': TcTalkControlElement;
    }
}
