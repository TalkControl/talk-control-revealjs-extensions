/**
 * Temporary polyfill, to be removed once Safari stable supports typed
 * `attr()` (`attr(data-tc-x type(<color>))`), see #93.
 *
 * Chrome/Edge 133+ and Firefox 155+ read `--tc-*` custom properties directly
 * from `data-tc-*` attributes via typed `attr()` in CSS (see
 * `src/scss/theme/helpers/icons.scss` and
 * `src/scss/theme/specifics/admonition.scss`). Safari stable does not
 * support the typed form yet. This module detects that case and mirrors the
 * finite set of `data-tc-*` attributes below onto the matching inline
 * `--tc-*` custom property, so the same CSS rules resolve the same value on
 * every browser.
 *
 * The mapping is a 1:1 naming convention (`data-tc-X` -> `--tc-X`), kept as
 * an explicit table rather than derived "magically" from the attribute name.
 */

/**
 * The finite set of `data-tc-*` attributes this polyfill understands, and
 * the `--tc-*` custom property each one feeds. Keep this table in sync with
 * the SCSS files that read these custom properties (a guard test in
 * `src/marked/marked-tc-admonition.spec.ts` / PR 2 of #52 checks this).
 */
const ATTR_TO_CSS_VAR: Record<string, string> = {
    'data-tc-icon-color': '--tc-icon-color',
    'data-tc-icon-size': '--tc-icon-size',
    'data-tc-admonition-bg-color': '--tc-admonition-bg-color',
};

const WATCHED_ATTRIBUTES = Object.keys(ATTR_TO_CSS_VAR);
const WATCHED_ATTRIBUTES_SELECTOR = WATCHED_ATTRIBUTES.map(
    (attrName) => `[${attrName}]`
).join(',');

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
 * Mirrors every watched `data-tc-*` attribute present on `element` onto its
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
    for (const [attrName, cssVar] of Object.entries(ATTR_TO_CSS_VAR)) {
        if (htmlElement.hasAttribute(attrName)) {
            const value = htmlElement.getAttribute(attrName);
            if (value !== null) {
                htmlElement.style.setProperty(cssVar, value);
            }
        }
    }
}

/**
 * Applies `applyWatchedAttributes` to `root` itself (if it matches) and to
 * every matching descendant.
 */
function applyWatchedAttributesTree(root: Element): void {
    applyWatchedAttributes(root);
    if (!WATCHED_ATTRIBUTES_SELECTOR) {
        return;
    }
    const descendants = root.querySelectorAll(WATCHED_ATTRIBUTES_SELECTOR);
    for (const descendant of descendants) {
        applyWatchedAttributes(descendant);
    }
}

/**
 * Handles a single `MutationObserver` record: re-applies watched attributes
 * on newly added nodes, and keeps a changed/removed attribute's `--tc-*`
 * property in sync (removing it when the attribute is removed).
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
        const cssVar = ATTR_TO_CSS_VAR[mutation.attributeName];
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
 * subtree, for slides added after the fact) with a `MutationObserver`
 * scoped to the finite set of watched attributes.
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
        attributeFilter: WATCHED_ATTRIBUTES,
    });
}

// Add conditionnal export for test
export const _internals =
    typeof process !== 'undefined' && process?.env?.NODE_ENV === 'test'
        ? {
              ATTR_TO_CSS_VAR,
              supportsTypedAttr,
              applyWatchedAttributes,
              applyWatchedAttributesTree,
              handleMutation,
          }
        : undefined;
