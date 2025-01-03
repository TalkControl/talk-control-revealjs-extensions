import { MarkedTcIconsOptions } from "../marked/marked-tc-icons";
import feather from 'feather-icons';


export function featherIconPack(): MarkedTcIconsOptions {
    return {
        keyword: 'feather',
        includesKeyword: false,
        htmlAttribute: 'data-feather',
        initFunction: () => {
            feather.replace();
        }
    }
}