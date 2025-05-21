import { MarkedTcIconsOptions } from '../marked/marked-tc-icons';
import feather from 'feather-icons';

export function featherIconPack(): MarkedTcIconsOptions {
    return {
        keyword: 'feather',
        copyKeyword: 'copy',
        htmlAttribute: 'data-feather',
        initFunction: () => {
            feather.replace();
        },
    };
}
