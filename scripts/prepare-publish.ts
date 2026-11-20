import { PackageJson } from 'type-fest';
import { VENDOR_MANIFEST } from './vendor-manifest';
import { buildPackageJson } from './utils/package-json.utils';
import { copyVendor } from './copy-vendor';
import packageJson from '../package.json';
import path from 'node:path';
import viteConfig from '../vite.config';

const DIST = viteConfig.build!.outDir!;

buildPackageJson(packageJson as PackageJson, DIST);
copyVendor(VENDOR_MANIFEST, { vendorRoot: path.join(DIST, 'vendor') });
