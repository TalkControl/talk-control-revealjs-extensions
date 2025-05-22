import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SlideTreeEntry } from '../models';
import { saveSlidesSelected } from '../utils/storage-service';

/**
 * The tree checkbox element
 *
 * @csspart button - The button
 */
@customElement('tc-tree-slides-element')
export class TcTreeSlidesElement extends LitElement {
    //slides: SlidePath[] = [];

    @property()
    slides: SlideTreeEntry[] = [];

    private treeArray: (SlideTreeEntry[] | [string, SlideTreeEntry[]])[] = [];

    render() {
        this.recalculateSlides();
        return html`
            <ul>
                ${this.treeArray.map(([key, value]) =>
                    this.renderTreeElement(
                        key as string,
                        value as SlideTreeEntry[]
                    )
                )}
            </ul>
        `;
    }

    /**
     *
     * @param {*} key the prefix of the tree. Key could be a path if no prefix
     * @param {*} value the array of path under the prefix. Value could be null if no prefix.
     * @returns the render litHTML Method
     */
    renderTreeElement(
        key: string | SlideTreeEntry,
        value?: SlideTreeEntry[] | undefined
    ) {
        if (value) {
            // We have a tree to render
            return html`<li>
                <input @click="${(e: InputEvent) =>
                    this.checkPrefix(
                        e,
                        key as string
                    )}" type="checkbox" .checked=${
                    value.reduce((acc, elt) => acc + (elt.check ? 1 : 0), 0) ===
                    value.length
                }></input><span>${key}</span>
                <ul>
                    ${value.map((elt) => this.renderLiElement(elt))}
                </ul>
            </li>`;
        } else {
            // Everything is in the key
            return this.renderLiElement(key as SlideTreeEntry);
        }
    }

    /**
     * Method that render a leaf of the tree
     * @param {*} slide : a slide element with path, index, check, prefix
     * @returns the render method
     */
    renderLiElement(slide: SlideTreeEntry) {
        return html`<li>
                    <input @click="${(e: InputEvent) =>
                        this.checkSlide(
                            e,
                            slide.index
                        )}" type="checkbox" .checked=${slide.check}>
                        </input>${slide.path}
                </li>`;
    }

    /**
     * Handler method that deals with the checkbox of the prefix.
     * This method will update the state and the session storage and reset the UI
     * @param {*} event : click event
     * @param {*} prefix : the prefix of the slides (to update the state of children slides)
     */
    checkPrefix(event: InputEvent, prefix: string) {
        this.slides.forEach((elt) => {
            console.log('click prefix', prefix, elt.prefix === prefix);
            if (elt.prefix === prefix) {
                console.log(
                    'Change element to ',
                    (event?.target as HTMLInputElement).checked
                );
                elt.check = (event?.target as HTMLInputElement).checked;
            }
        });
        saveSlidesSelected(this.slides);
        this.fireSlidesSelected();
    }

    /**
     * Handler method that deals with the checkbox of a slide.
     * This method will update the state and the session storage and reset the UI
     * @param {*} event : click event
     * @param {*} index : the index of the slide in the state
     */
    checkSlide(event: InputEvent, index: number) {
        this.slides[index].check = (event?.target as HTMLInputElement).checked;
        saveSlidesSelected(this.slides);
        this.fireSlidesSelected();
    }

    /**
     *
     * Utilities methods
     */

    fireSlidesSelected() {
        const eventSlides = new CustomEvent('slides-selected', {
            detail: this.slides,
            bubbles: true,
            composed: true,
        });
        this.dispatchEvent(eventSlides);
        this.requestUpdate();
    }

    /**
     * Method to recalculate the slides
     */
    recalculateSlides() {
        //this.slidesEntries = this.slidesToTree(this.slides);
        this.treeArray = this.createTreeFromSlides(this.slides);
    }

    /**
     * Transform the slides array to a tree structure to render it
     * it will only allow a one level tree depth.
     *
     * All the path with no prefix will be in the first element of the array
     * @returns the tree structure of slides in an array
     */
    createTreeFromSlides(
        slidesEntries: SlideTreeEntry[]
    ): (SlideTreeEntry[] | [string, SlideTreeEntry[]])[] {
        const tree: Record<string, SlideTreeEntry[]> = {};
        const emptyArray: SlideTreeEntry[][] = [];
        // We will group all files with the same prefix
        slidesEntries.forEach((slide) => {
            if (slide.prefix) {
                if (!tree[slide.prefix]) {
                    tree[slide.prefix] = [];
                }
                tree[slide.prefix].push(slide);
            } else {
                // If the prefix is empty, we will add it to the first element of the array
                emptyArray.push([slide]);
            }
        });
        // We return the entries of the tree to manipulate it
        const treeArray: (SlideTreeEntry[] | [string, SlideTreeEntry[]])[] =
            Object.entries(tree);
        treeArray.unshift(...emptyArray);
        // Tree Array is like this :
        /*
        [
            [
                {"path":"slide.md","index":0,"check":true}
            ],
            [
                "prefix-1",
                [
                    {"prefix":"prefix-1","path":"slide-1.md","index":1,"check":true},
                    {"prefix":"prefix-1","path":"slide-2.md","index":2,"check":true},
                    {"prefix":"prefix-1","path":"slide-3.md","index":3,"check":true}
                ]
            ],[
                "prefix-2",
                [
                    {"prefix":"prefix-2","path":"slide-4.md","index":4,"check":true}
                ]
            ]
        ]
        */

        return treeArray;
    }

    static styles = css`
        :host {
            overflow-y: auto;
        }

        ul {
            list-style-type: none;
        }
        li {
            margin: 10px;
        }
    `;
}

declare global {
    interface HTMLElementTagNameMap {
        'tc-tree-slides-element': TcTreeSlidesElement;
    }
}
