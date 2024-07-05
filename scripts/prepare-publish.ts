import { PROJECT_ROOT } from './utils/dir.utils';
import { PackageJson } from 'type-fest';
import { buildPackageJson } from './utils/package-json.utils';
import packageJson from '../package.json';
import path from 'node:path';
import viteConfig from '../vite.config';

const NODE_MODULES = path.join(PROJECT_ROOT, 'node_modules');
const DIST = viteConfig.build!.outDir!;

buildPackageJson(packageJson as PackageJson, DIST);
// prepareIcons(DIST);
