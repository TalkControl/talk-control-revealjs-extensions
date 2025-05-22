import { html, render } from 'lit-html';
import { SlidePath } from '../models';
import { _handle_parameter } from '../utils/helper';

export class TcUiConfig {
    private state: {
        show: boolean;
        slides: SlidePath[];
        theme: string;
        type: string;
        language: string;
    };

    constructor(slides: SlidePath[]) {
        this.state = {
            show: false,
            slides,
            theme: '',
            type: '',
            language: '',
        };
        this.init();
    }
    init() {
        // Add listener to open the slide selector
        document.body.addEventListener('keyup', (e) => this._keyUpHandler(e));

        this.initModes();
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
            'theme',
            slidesElement,
            'data-theme-slides',
            ''
        );
        this.state.type = _handle_parameter(
            urlParams,
            'type',
            slidesElement,
            'data-type-show',
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
            this.state.show = true;
            this.resetOrCreateUI();
        } else if (e.key === 'Escape' && this.state.show) {
            e.preventDefault();
            this.closeUI();
        }
    }

    /**
     * Close the UI
     */
    closeUI() {
        this.state.show = false;
        const elementSelection: HTMLElement =
            document.querySelector('#ui-slide-selector')!;
        if (elementSelection) {
            elementSelection.remove();
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
        return render(
            html`
                <tc-configurator-element
                    .slides="${this.state.slides}"
                    .theme="${this.state.theme}"
                    .type="${this.state.type}"
                    .i18n="${this.state.language}"
                    @close-ui="${() =>
                        this.closeUI()}"></tc-configurator-element>
            `,
            element
        );
    }
}
