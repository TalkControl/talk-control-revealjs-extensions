import 'material-symbols';

import { MarkedTcIconsOptions } from "../marked/marked-tc-icons";

export function materialSymbolsIconPack(): MarkedTcIconsOptions {
    return {
        keyword: 'material-symbols',
        includesKeyword: false,
        htmlAttribute: 'class',
        iconInTag: true,
    };
}