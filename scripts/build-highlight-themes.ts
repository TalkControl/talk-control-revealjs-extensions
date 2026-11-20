import path from 'node:path';
import viteConfig from '../vite.config';
import { writeHighlightThemes } from './utils/highlight-themes.utils';

const DIST = viteConfig.build!.outDir!;

writeHighlightThemes(path.join(DIST, 'highlight'));
