/**
 * Temporary polyfill, to be removed once Safari stable supports typed
 * `attr()` (`attr(data-tc-x type(<color>))`), see #93.
 *
 * Chrome/Edge 133+ and Firefox 155+ read `--tc-*` custom properties directly
 * from `data-tc-*` attributes via typed `attr()` in CSS (see
 * `src/scss/theme/helpers/icons.scss`, `src/scss/theme/specifics/admonition.scss`
 * and `src/scss/theme/classics/transitions.scss`). Safari stable does not
 * support the typed form yet. This module detects that case and mirrors
 * *any* `data-tc-*` attribute onto the matching inline `--tc-*` custom
 * property, so the same CSS rules resolve the same value on every browser.
 *
 * The mapping is a 1:1 naming convention (`data-tc-X` -> `--tc-X`), derived
 * directly from the attribute name (strip the `data-` prefix) rather than
 * kept as an explicit table. This is a deliberate change from the original
 * design (#52): a hand-maintained table had to grow by one entry for every
 * new `data-tc-*` attribute added to the SCSS (see the review on #134),
 * which does not scale. The naming convention itself was always strict 1:1
 * (documented in docs/attributes.md), so deriving the custom property name
 * from the attribute name loses no information.
 */

const DATA_TC_PREFIX = 'data-tc-';

/**
 * CSS declaration used to detect native support for typed `attr()`. It is
 * only a detection probe: a browser that fails to parse it simply ignores
 * the declaration, which `CSS.supports` reports as `false`.
 */
const NATIVE_SUPPORT_PROBE = 'width: attr(data-tc-probe type(<length>), 0px)';

/**
 * Detects native support for typed `attr()`. Treats a missing `CSS` global
 * or a missing `CSS.supports` as "not supported", never throws.
 */
function supportsTypedAttr(): boolean {
    if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') {
        return false;
    }
    return CSS.supports(NATIVE_SUPPORT_PROBE);
}

/**
 * Derives the `--tc-*` custom property name fed by a `data-tc-*` attribute,
 * by convention (strip the `data-` prefix). Returns `null` for an attribute
 * that is not one of ours.
 */
function cssVarForAttribute(attrName: string): string | null {
    if (!attrName.startsWith(DATA_TC_PREFIX)) {
        return null;
    }
    return `--${attrName.slice('data-'.length)}`;
}

/**
 * Mirrors every `data-tc-*` attribute present on `element` onto its
 * matching inline `--tc-*` custom property. Writing inline always wins over
 * a manually-authored `style="--tc-*"` or a class-based default (`tc-small`
 * / `tc-big`), matching the documented priority order: attribute > inline
 * style > classes > theme default.
 */
function applyWatchedAttributes(element: Element): void {
    const htmlElement = element as HTMLElement;
    if (!htmlElement.style) {
        return;
    }
    for (const attrName of htmlElement.getAttributeNames()) {
        const cssVar = cssVarForAttribute(attrName);
        if (!cssVar) {
            continue;
        }
        const value = htmlElement.getAttribute(attrName);
        if (value !== null) {
            htmlElement.style.setProperty(cssVar, value);
        }
    }
}

/**
 * Applies `applyWatchedAttributes` to `root` itself and to every descendant.
 *
 * There is no CSS selector for "an attribute whose *name* starts with X"
 * (only `[attr^=value]`, which matches on the attribute's *value*), so this
 * cannot be a `querySelectorAll` call. Instead it walks the actual element
 * tree with a `TreeWalker` and inspects each element's real attributes.
 * This is O(elements x attributes per element), which is fine for a slide
 * deck: it runs once at activation and once per node added afterwards, not
 * on every frame.
 */
function applyWatchedAttributesTree(root: Element): void {
    applyWatchedAttributes(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    let node = walker.nextNode();
    while (node) {
        applyWatchedAttributes(node as Element);
        node = walker.nextNode();
    }
}

/**
 * Handles a single `MutationObserver` record: re-applies `data-tc-*`
 * attributes on newly added nodes, and keeps a changed/removed attribute's
 * `--tc-*` property in sync (removing it when the attribute is removed).
 */
function handleMutation(mutation: MutationRecord): void {
    if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
            if (node instanceof Element) {
                applyWatchedAttributesTree(node);
            }
        });
        return;
    }

    if (mutation.type === 'attributes' && mutation.attributeName) {
        const cssVar = cssVarForAttribute(mutation.attributeName);
        if (!cssVar) {
            return;
        }
        const target = mutation.target as HTMLElement;
        if (!target.style) {
            return;
        }
        const value = target.getAttribute(mutation.attributeName);
        if (value === null) {
            target.style.removeProperty(cssVar);
        } else {
            target.style.setProperty(cssVar, value);
        }
    }
}

/**
 * Activates the polyfill on `root` (typically the `.reveal .slides`
 * element): no-op when `root` is `null`, and no-op (no scan, no observer)
 * when the browser already supports typed `attr()` natively.
 *
 * Otherwise performs an initial scan of `root` and watches it (and its
 * subtree, for slides added after the fact) with a `MutationObserver`. The
 * observer watches every attribute mutation (no `attributeFilter`, since the
 * set of `data-tc-*` attributes is open-ended) and filters by the
 * `data-tc-` prefix in the handler instead.
 */
export function manageAttrPolyfill(root: HTMLElement | null): void {
    if (!root) {
        return;
    }
    if (supportsTypedAttr()) {
        return;
    }

    applyWatchedAttributesTree(root);

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            handleMutation(mutation);
        }
    });

    observer.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
    });
}

// Add conditionnal export for test
export const _internals =
    typeof process !== 'undefined' && process?.env?.NODE_ENV === 'test'
        ? {
              cssVarForAttribute,
              supportsTypedAttr,
              applyWatchedAttributes,
              applyWatchedAttributesTree,
              handleMutation,
          }
        : undefined;
