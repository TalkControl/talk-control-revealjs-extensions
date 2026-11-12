import { SlidePath, SlideTreeEntry } from '../models';
import { html, render } from 'lit-html';
import { _handle_parameter } from '../utils/helper';
import { getSlidesSelected } from '../utils/storage-service';

export class TcUiConfig {
    private state: {
        show: boolean;
        slidesEntries: SlideTreeEntry[];
        theme: string;
        defaultTheme: string;
        type: string;
        defaultType: string;
        language: string;
        defaultLanguage: string;
    };

    /** The element focus should return to once the dialog closes. */
    private previouslyFocusedElement: HTMLElement | null = null;
    /** Siblings of the dialog's container that were made `inert` while it is open. */
    private inertedElements: HTMLElement[] = [];

    constructor(
        slides: SlidePath[],
        defaultLanguage: string,
        defaultTheme: string,
        defaultType: string
    ) {
        this.state = {
            show: false,
            slidesEntries: this.slidesToTree(slides),
            theme: '',
            defaultTheme,
            type: '',
            defaultType,
            language: '',
            defaultLanguage,
        };
        this.init();
    }
    init() {
        // Add listener to open the slide selector
        document.body.addEventListener('keyup', (e) => this._keyUpHandler(e));

        this.initModes();
        this.createTriggerButton();
    }

    /**
     * Creates the visible, keyboard-reachable button that opens the
     * configurator. Until now the dialog could only be opened with the `C`
     * keyboard shortcut, with no on-screen control for users who don't know
     * about it.
     */
    createTriggerButton(): HTMLButtonElement {
        let button = document.querySelector(
            '#tc-configurator-trigger'
        ) as HTMLButtonElement;
        if (!button) {
            button = document.createElement('button');
            button.id = 'tc-configurator-trigger';
            button.type = 'button';
            button.setAttribute(
                'aria-label',
                'Open the TalkControl configurator (shortcut: C)'
            );
            button.title = 'Open the TalkControl configurator (shortcut: C)';
            button.innerHTML = '<span aria-hidden="true">⚙️</span>';
            button.addEventListener('click', () => this.openUI());
            document.body.appendChild(button);
        }
        return button;
    }

    /**
     * Opens the configurator, remembering what had focus so it can be
     * restored on close, and making the rest of the page `inert` so focus
     * and screen-reader navigation stay trapped in the dialog.
     */
    openUI(): void {
        if (this.state.show) return;
        this.previouslyFocusedElement =
            (document.activeElement as HTMLElement) ?? null;
        this.state.show = true;
        this.resetOrCreateUI();
        this.applyInert();
    }

    /**
     * Init the modes (Theme, Language, Type) according to parameters available in the session storage
     */
    initModes() {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const slidesElement: HTMLElement =
            document.querySelector('.reveal .slides')!;

        // We only get informations from url or inside html

        this.state.theme = _handle_parameter(
            urlParams,
            'data-theme',
            slidesElement,
            'data-theme',
            ''
        );
        this.state.type = _handle_parameter(
            urlParams,
            'data-type',
            slidesElement,
            'data-type',
            ''
        );
        this.state.language = _handle_parameter(
            urlParams,
            'data-lang',
            slidesElement,
            'data-lang',
            ''
        );
    }

    /**
     *
     * @param slides : the slides array to transform
     * @returns
     */
    slidesToTree(slides: SlidePath[]): SlideTreeEntry[] {
        const slideArrayFromSession = getSlidesSelected();
        const mapSlidesInSession = new Map();
        for (const slideInSession of slideArrayFromSession) {
            mapSlidesInSession.set(slideInSession.index, slideInSession);
        }
        const slidesArray: SlideTreeEntry[] = [];
        const regex = /^(?:(.+?)\/)?(.+?)(?=\.md$)/;
        for (const slide of slides) {
            const [, prefix, path] = slide.path.match(regex)!;
            const slideTmp = {
                prefix,
                path: path + '.md',
                index: slidesArray.length,
                check: true,
            };
            if (mapSlidesInSession.has(slideTmp.index)) {
                slideTmp.check = mapSlidesInSession.get(slideTmp.index).check;
            }
            slidesArray.push(slideTmp);
        }
        return slidesArray;
    }

    /**
     * Handler that open the slide selector
     * @param {*} e keyup event
     */
    _keyUpHandler(e: KeyboardEvent) {
        if (
            (e.key === 'c' || e.key === 'C') &&
            !e.ctrlKey &&
            !e.shiftKey &&
            !e.metaKey &&
            !this.state.show
        ) {
            e.preventDefault();
            this.openUI();
        } else if (e.key === 'Escape' && this.state.show) {
            e.preventDefault();
            this.closeUI();
        }
    }

    /**
     * Close the UI, lifting the `inert` applied to the rest of the page and
     * restoring focus to whatever triggered the dialog's opening.
     */
    closeUI() {
        this.state.show = false;
        const elementSelection: HTMLElement =
            document.querySelector('#ui-slide-selector')!;
        if (elementSelection) {
            elementSelection.remove();
        }
        this.removeInert();
        this.restoreFocus();
    }

    /**
     * Makes every sibling of the dialog's container `inert`, so focus,
     * pointer interaction and assistive-technology navigation stay trapped
     * inside the configurator while it is open.
     */
    private applyInert(): void {
        const container = document.querySelector('#ui-slide-selector');
        this.inertedElements = Array.from(document.body.children).filter(
            (element): element is HTMLElement =>
                element !== container && element instanceof HTMLElement
        );
        for (const element of this.inertedElements) {
            element.setAttribute('inert', '');
        }
    }

    /**
     * Lifts the `inert` applied by {@link applyInert}.
     */
    private removeInert(): void {
        for (const element of this.inertedElements) {
            element.removeAttribute('inert');
        }
        this.inertedElements = [];
    }

    /**
     * Restores focus to the element that was focused right before the
     * dialog opened (the visible trigger button, or whatever had focus when
     * the `C` shortcut was used).
     */
    private restoreFocus(): void {
        const target = this.previouslyFocusedElement;
        this.previouslyFocusedElement = null;
        if (target && document.body.contains(target)) {
            target.focus();
        }
    }

    /**
     * Render the ui (creation of element if not exist, else reset the content of the element)
     */
    resetOrCreateUI() {
        let elementSelection: HTMLElement =
            document.querySelector('#ui-slide-selector')!;
        if (!elementSelection) {
            elementSelection = document.createElement('DIV');
            elementSelection.id = 'ui-slide-selector';
            elementSelection.setAttribute(
                'style',
                'position:absolute; width:100%; height: 100%; top:0; left:0; z-index:100;'
            );
            document.body.appendChild(elementSelection);
        }
        elementSelection.style.display = this.state.show ? 'grid' : 'none';
        // We finally init the UI
        this.initUI(elementSelection);
    }

    /**
     * Main method to create the UI
     * @param {*} element : the html element where we inject the UI
     * @returns the render of the UI
     */
    initUI(element: HTMLElement) {
        // We convert our files path to a tree structure
        // Warning, it is mandatory to ad contenteditable to the element in order let revealjs know that it is editable and not activate the keyboard shortcuts
        return render(
            html`
                <tc-configurator-element
                    contenteditable
                    .slides="${this.state.slidesEntries}"
                    .theme="${this.state.theme}"
                    .defaultTheme="${this.state.defaultTheme}"
                    .type="${this.state.type}"
                    .defaultType="${this.state.defaultType}"
                    .i18n="${this.state.language}"
                    .defaultI18n="${this.state.defaultLanguage}"
                    @close-ui="${() =>
                        this.closeUI()}"></tc-configurator-element>
            `,
            element
        );
    }
}
