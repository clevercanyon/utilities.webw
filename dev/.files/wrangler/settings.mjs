/**
 * Wrangler settings file.
 *
 * Wrangler is not aware of this config file's location. We use the exports provided by this file to centralize a few
 * settings associated with Wrangler that are reused across various tools that integrate with Wrangler.
 *
 * @note PLEASE DO NOT EDIT THIS FILE!
 * @note This entire file will be updated automatically.
 * @note Instead of editing here, please review <https://github.com/clevercanyon/skeleton>.
 */

import os from 'node:os';
import path from 'node:path';
import { $fs } from '../../../node_modules/@clevercanyon/utilities.node/dist/index.js';
import { $str } from '../../../node_modules/@clevercanyon/utilities/dist/index.js';
import u from '../bin/includes/utilities.mjs';

const pkg = await u.pkg(); // From utilities.
const __dirname = $fs.imuDirname(import.meta.url);
const projDir = path.resolve(__dirname, '../../..');

/**
 * Defines Wrangler settings.
 */
export default {
    compatibilityDate: '2023-08-15',
    compatibilityFlags: [], // None at this time.

    defaultZoneName: 'hop.gdn',
    defaultZoneDomain: 'workers.hop.gdn',
    defaultAccountId: 'f1176464a976947aa5665d989814a4b1',

    defaultWorkerName: $str.kebabCase(path.basename(pkg.name || ''), { asciiOnly: true }),
    defaultProjectName: $str.kebabCase(path.basename(pkg.name || ''), { asciiOnly: true }),

    osDir: path.resolve(os.homedir(), './.wrangler'),
    projDir: path.resolve(projDir, './.wrangler'),
    projStateDir: path.resolve(projDir, './.wrangler/state'),

    osSSLCertDir: path.resolve(os.homedir(), './.wrangler/local-cert'),
    osSSLKeyFile: path.resolve(os.homedir(), './.wrangler/local-cert/key.pem'),
    osSSLCertFile: path.resolve(os.homedir(), './.wrangler/local-cert/cert.pem'),

    customSSLKeyFile: path.resolve(projDir, './dev/.files/bin/ssl-certs/i10e-ca-key.pem'),
    customSSLCertFile: path.resolve(projDir, './dev/.files/bin/ssl-certs/i10e-ca-crt.pem'),
};
