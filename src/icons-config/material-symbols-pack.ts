import 'material-symbols';

import { MarkedTcIconsOptions } from '../marked/marked-tc-icons';

export function materialSymbolsIconPack(): MarkedTcIconsOptions {
    return {
        keyword: 'material-symbols',
        copyKeyword: 'content_copy',
        htmlAttribute: 'class',
        iconInTag: true,
    };
}
