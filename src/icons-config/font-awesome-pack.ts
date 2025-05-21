import '@fortawesome/fontawesome-free/js/all.js';
import '@fortawesome/fontawesome-free/css/all.css';

import { MarkedTcIconsOptions } from '../marked/marked-tc-icons';

export function fontAwesomeIconPack(): MarkedTcIconsOptions {
    return {
        keyword: 'fa',
        copyKeyword: 'fa-copy',
        includesKeyword: true,
        htmlAttribute: 'class',
    };
}
