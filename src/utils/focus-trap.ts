/**
 * CSS selector matching elements that are focusable by default. Used to walk
 * a dialog's (possibly shadow-DOM-crossing) tree and find its tab stops.
 */
const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button',
    'input',
    'select',
    'textarea',
    'audio[controls]',
    'video[controls]',
    '[contenteditable="true"]',
    '[tabindex]',
].join(',');

function isDisabled(element: HTMLElement): boolean {
    return (
        element.hasAttribute('disabled') ||
        element.getAttribute('aria-disabled') === 'true'
    );
}

function hasNegativeTabIndex(element: HTMLElement): boolean {
    const tabindex = element.getAttribute('tabindex');
    return tabindex !== null && Number(tabindex) < 0;
}

/**
 * Walks `element` and its ancestors - crossing shadow-root boundaries via
 * the host chain - looking for anything that would keep it from being
 * rendered: the native `hidden` attribute (used by the configurator's
 * `?hidden` tab panels), `display: none`, or `visibility: hidden`.
 */
function isVisible(element: HTMLElement): boolean {
    let node: HTMLElement | null = element;

    while (node) {
        if (node.hidden) return false;

        const style = getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden') {
            return false;
        }

        if (node.parentElement) {
            node = node.parentElement;
        } else {
            const root = node.getRootNode();
            node =
                root instanceof ShadowRoot ? (root.host as HTMLElement) : null;
        }
    }

    return true;
}

/**
 * Recursively collects the focusable elements under `root`, in document
 * order, descending into any (open) shadow root encountered along the way.
 *
 * This is what lets the configurator dialog's focus trap work across its
 * nested custom elements (`tc-talk-control-element`, `tc-revealjs-element`,
 * `tc-tree-slides-element`), each rendered in its own shadow root: a plain
 * `querySelectorAll` would stop at the first shadow boundary.
 */
export function getFocusableElements(root: ParentNode): HTMLElement[] {
    const result: HTMLElement[] = [];

    for (const child of Array.from(root.children)) {
        const element = child as HTMLElement;

        if (
            element.matches(FOCUSABLE_SELECTOR) &&
            !isDisabled(element) &&
            !hasNegativeTabIndex(element) &&
            isVisible(element)
        ) {
            result.push(element);
        }

        if (element.shadowRoot) {
            result.push(...getFocusableElements(element.shadowRoot));
        } else {
            result.push(...getFocusableElements(element));
        }
    }

    return result;
}

/**
 * `document.activeElement`, resolved through nested (open) shadow roots.
 */
export function getDeepActiveElement(): Element | null {
    let active: Element | null = document.activeElement;
    while (active?.shadowRoot?.activeElement) {
        active = active.shadowRoot.activeElement;
    }
    return active;
}

/**
 * Keeps Tab / Shift+Tab navigation inside `root`: when focus would leave the
 * first/last focusable element (or has somehow already left `root`), it
 * wraps/forces focus back around instead of letting it escape to the rest of
 * the page.
 *
 * Call this from a `keydown` listener on the dialog; it calls
 * `preventDefault()` itself when it acts.
 *
 * @returns true if the key press was handled
 */
export function trapTabKey(root: ParentNode, event: KeyboardEvent): boolean {
    if (event.key !== 'Tab') return false;

    const focusable = getFocusableElements(root);
    if (focusable.length === 0) return false;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = getDeepActiveElement();
    const activeIsTracked =
        active !== null && focusable.includes(active as HTMLElement);

    if (event.shiftKey) {
        if (!activeIsTracked || active === first) {
            event.preventDefault();
            last.focus();
            return true;
        }
    } else {
        if (!activeIsTracked || active === last) {
            event.preventDefault();
            first.focus();
            return true;
        }
    }

    return false;
}
