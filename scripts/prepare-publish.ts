import { PackageJson } from 'type-fest';
import { buildPackageJson } from './utils/package-json.utils';
import packageJson from '../package.json';
import viteConfig from '../vite.config';

const DIST = viteConfig.build!.outDir!;

buildPackageJson(packageJson as PackageJson, DIST);
