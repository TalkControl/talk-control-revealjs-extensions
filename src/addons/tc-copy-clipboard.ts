import { MarkedTcIconsOptions } from '../marked/marked-tc-icons';

export interface TcCopyClipboardOptions {
    active?: boolean; // Activate the copy to clipboard
    tcIconOption?: MarkedTcIconsOptions; //  MackedTcIconsOptions to use
}

/**
 * Add the copy to clipboard icon to each code block
 * @param options the font to use and the icon to use
 * @returns void
 */
export function manageCopyClipboard(options: TcCopyClipboardOptions): void {
    if (!options.active || !options.tcIconOption) {
        return;
    }

    // We check if the icon option is valid
    const iconElement = _getIconElement(
        options.tcIconOption,
        options.tcIconOption.copyKeyword
    );

    // First we add to each codeblock the icon
    const preBlocks = [
        ...document.querySelectorAll(
            '.reveal .slides *:is(.with-code, .with-code-dark, .with-code-bg-dark) pre:has(code)'
        ),
    ];

    for (const preBlockElt of preBlocks) {
        preBlockElt?.appendChild(iconElement.cloneNode(true));
    }

    if (options.tcIconOption.initFunction) {
        // We call the init function if any
        options.tcIconOption.initFunction();
    }

    // Second we listen to click on it in order to copy the code to clipboard
    const copyToClipboardIcons = [
        ...document.querySelectorAll(
            '.reveal .slides section .tc-copy-to-clipboard'
        ),
    ] as HTMLElement[];

    // We add the event listener to each icon
    for (const copyIcon of copyToClipboardIcons) {
        copyIcon?.addEventListener('click', _addToClipboardCallback);
    }
}

/**
 * Callback function when the icon is clicked
 * @param event
 */
function _addToClipboardCallback(event: Event): void {
    // Check the spam target element (a path could be selected)
    let targetSpanElement = event?.target as HTMLElement;
    if (targetSpanElement.tagName !== 'SPAN') {
        targetSpanElement = targetSpanElement.closest('span')!;
    }
    const parentPreElement = targetSpanElement.closest('pre')!;

    const codeBlock = parentPreElement.querySelector('code')!;
    // Copy the text to clipboard
    const textToCopy = codeBlock.innerText;
    navigator.clipboard.writeText(textToCopy);

    // Notify graphicly the copy
    if (targetSpanElement.classList.contains('copied')) {
        targetSpanElement.classList.remove('copied');
    }
    targetSpanElement.classList.add('copied');
    setTimeout(() => {
        targetSpanElement.classList.remove('copied');
    }, 300);

    // Add the popup
    _addPopupCopied(parentPreElement);
}

/**
 * Display a popup to notify the user that the code has been copied
 * @param parentPreElement
 * @returns
 */
function _addPopupCopied(parentPreElement: HTMLElement): void {
    // We check if the popup is already there
    if (document.querySelector('.tc-copy-popup')) {
        return;
    }
    // add popup that disappear
    const popup = document.createElement('div');
    popup.classList.add('tc-copy-popup');
    popup.innerText = 'Copied to clipboard';
    parentPreElement.appendChild(popup);
    setTimeout(() => {
        popup.classList.add('hide');
        setTimeout(() => {
            parentPreElement.removeChild(popup);
        }, 1000);
    }, 1000);
}

/**
 * Create the icon element
 * @param tcIcon the configuration of fonticon to use
 * @param icon the icon to use
 * @returns the icon html element
 */
function _getIconElement(
    tcIcon: MarkedTcIconsOptions,
    icon: string
): HTMLElement {
    const iconElement = document.createElement('i');
    // deal with the icon
    let classValue = 'tc-icons';
    if (tcIcon.htmlAttribute === 'class') {
        if (!tcIcon.iconInTag) {
            classValue += ' ' + icon;
        }
        if (tcIcon.includesKeyword) {
            classValue += ' ' + tcIcon.keyword;
        }
    } else {
        let htmlAttributeValue = '';
        if (!tcIcon.iconInTag) {
            htmlAttributeValue += icon;
        }
        if (tcIcon.includesKeyword) {
            htmlAttributeValue += ' ' + tcIcon.keyword;
        }
        iconElement.setAttribute(tcIcon.htmlAttribute, htmlAttributeValue);
    }
    if (tcIcon.iconInTag) {
        iconElement.innerHTML = icon;
    }
    iconElement.setAttribute('class', classValue);

    const spanIconElement = document.createElement('span');
    spanIconElement.classList.add('tc-copy-to-clipboard');
    spanIconElement.appendChild(iconElement);

    return spanIconElement;
}

// Add conditionnal export
export const _internals =
    typeof process !== 'undefined' && process?.env?.NODE_ENV === 'test'
        ? {
              _addToClipboardCallback,
              _addPopupCopied,
              _getIconElement,
          }
        : undefined;
