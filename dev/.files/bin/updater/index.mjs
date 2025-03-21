/**
 * Dotfiles updater.
 *
 * @note PLEASE DO NOT EDIT THIS FILE!
 * @note This entire file will be updated automatically.
 * @note Instead of editing here, please review <https://github.com/clevercanyon/skeleton>.
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { $chalk, $prettier } from '../../../../node_modules/@clevercanyon/utilities.node/dist/index.js';
import { $is, $json, $obj } from '../../../../node_modules/@clevercanyon/utilities/dist/index.js';
import u from '../../resources/utilities.mjs';
import customRegExp from './resources/custom-regexp.mjs';

/**
 * Updates dotfiles.
 *
 * WARNING: In this file, don't use anything from our `u` (utilities) package that resolves relative directory paths
 * and/or derives information from relative directory paths, without first calling `u.switchProjDir()` to properly
 * prepare utilities. When this file is called upon, it is passed a `projDir` explicitly. This file should only operate
 * on that project directory. Also, don't forget to `u.restoreProjDir()`, to restore the previous project directory.
 */
export default async ({ projDir }) => {
    /**
     * Switches to `projDir`.
     */
    await u.switchProjDir(projDir);

    /**
     * Deletes outdated paths no longer in use.
     */
    for (const relPath of []) {
        if (await u.isPkgDotfileLocked(relPath)) {
            continue; // Locked 🔒.
        }
        await fsp.rm(path.resolve(u.projDir, relPath), { recursive: true, force: true });
    }

    /**
     * Updates immutable directories.
     */
    for (const relPath of ['./dev/.files']) {
        await fsp.rm(path.resolve(u.projDir, relPath), { recursive: true, force: true });
        await fsp.mkdir(path.resolve(u.projDir, relPath), { recursive: true });
        await fsp.cp(path.resolve(u.__projDir, relPath), path.resolve(u.projDir, relPath), { recursive: true });
    }
    await fsp.chmod(path.resolve(u.dfBinDir, './envs.mjs'), 0o700);
    await fsp.chmod(path.resolve(u.dfBinDir, './install.mjs'), 0o700);
    await fsp.chmod(path.resolve(u.dfBinDir, './update.mjs'), 0o700);
    await fsp.chmod(path.resolve(u.dfBinDir, './ssl-certs/generate.bash'), 0o700);
    await fsp.chmod(path.resolve(u.dfBinDir, './ssl-certs/macos/update/keychain.bash'), 0o700);

    /**
     * Updates semi-immutable dotfiles.
     */
    for (const relPath of [
        './.npmrc',
        './.npmignore',

        './.gitignore',
        './.gitattributes',

        './.github/CODEOWNERS',
        './.github/dependabot.yml',
        './.github/workflows/ci.yml',

        './.editorconfig',
        './.vscodeignore',
        './.vscode/extensions.json',
        './.vscode/settings.json',
        './.vscode/settings.mjs',

        './eslint.config.mjs',
        './stylelint.config.mjs',
        './postcss.config.mjs',
        './tailwind.config.mjs',

        './prettier.config.mjs',
        './.prettierignore',

        './.dockerignore',
        './.shellcheckrc',
        './.browserslistrc',

        './.remarkrc.mjs',
        './.rehyperc.mjs',
        './mdx.config.mjs',

        './dev-types.d.ts',
        './tsconfig.json',
        './tsconfig.mjs',

        './jest.config.mjs',
        './vite.config.mjs',

        './wrangler.toml',
        './wrangler.mjs',

        './brand.config.mjs',
        './madrun.config.mjs',
    ]) {
        if (await u.isPkgDotfileLocked(relPath)) {
            continue; // Locked 🔒.
        }
        let newFileContents = ''; // Initialize.

        if (fs.existsSync(path.resolve(u.projDir, relPath))) {
            const oldFileContents = (await fsp.readFile(path.resolve(u.projDir, relPath))).toString();
            const oldFileMatches = customRegExp.exec(oldFileContents); // See `customRegExp` for details.
            const oldFileCustomCode = oldFileMatches ? oldFileMatches[2] : ''; // Preserves any custom code.

            newFileContents = (await fsp.readFile(path.resolve(u.__projDir, relPath))).toString()
                .replace(customRegExp, ($_, $1, $2, $3) => $1 + oldFileCustomCode + $3); // prettier-ignore
        } else {
            newFileContents = (await fsp.readFile(path.resolve(u.__projDir, relPath))).toString();
        }
        await fsp.mkdir(path.dirname(path.resolve(u.projDir, relPath)), { recursive: true });
        await fsp.writeFile(path.resolve(u.projDir, relPath), newFileContents);
    }

    /**
     * Adds up-to-date copies of missing mutable files.
     */
    for (const relPath of ['./LICENSE.txt', './README.md']) {
        if (await u.isPkgDotfileLocked(relPath)) {
            continue; // Locked 🔒.
        }
        if (!fs.existsSync(path.resolve(u.projDir, relPath))) {
            await fsp.cp(path.resolve(u.__projDir, relPath), path.resolve(u.projDir, relPath));
        }
    }

    /**
     * Adds and/or updates updateable JSON files.
     */
    for (const relPath of ['./package.json']) {
        if (await u.isPkgDotfileLocked(relPath)) {
            continue; // Locked 🔒.
        }
        if (!fs.existsSync(path.resolve(u.projDir, relPath))) {
            await fsp.cp(path.resolve(u.__projDir, relPath), path.resolve(u.projDir, relPath));
        }
        if ('./package.json' === relPath) {
            await u.updatePkg(); // Leverages existing highly-specific utility.
        } else {
            const updatesRelPath = relPath.replace(/(^|\/)([^/]+\.[^.]+)$/u, '$1_$2'); // Leading `_` in basename.
            const updatesFile = path.resolve(u.__dfBinDir, './updater/resources/data', updatesRelPath, './updates.json');

            if (fs.existsSync(updatesFile)) {
                const json = $json.parse((await fsp.readFile(path.resolve(u.projDir, relPath))).toString());
                const updates = $json.parse((await fsp.readFile(updatesFile)).toString());

                if (!$is.plainObject(json)) {
                    throw new Error('updater: Unable to parse `' + relPath + '`.');
                }
                if (!$is.plainObject(updates)) {
                    throw new Error('updater: Unable to parse `' + updatesFile + '`.');
                }
                $obj.patchDeep(json, updates); // Updates potentially contain declarative ops.
                const prettierConfig = { ...(await $prettier.resolveConfig(path.resolve(u.projDir, relPath))), parser: 'json' };
                await fsp.writeFile(path.resolve(u.projDir, relPath), await $prettier.format($json.stringify(json, { pretty: true }), prettierConfig));
            }
        }
    }

    /**
     * Recompiles static configurations.
     */
    u.log($chalk.green('Recompiling static configurations.'));

    await (await import('./resources/updaters/vscode/index.mjs')).default({ projDir: u.projDir });
    await (await import('./resources/updaters/gitattributes/index.mjs')).default({ projDir: u.projDir });
    await (await import('./resources/updaters/gitignore/index.mjs')).default({ projDir: u.projDir });
    await (await import('./resources/updaters/npmignore/index.mjs')).default({ projDir: u.projDir });
    await (await import('./resources/updaters/dockerignore/index.mjs')).default({ projDir: u.projDir });
    await (await import('./resources/updaters/vscodeignore/index.mjs')).default({ projDir: u.projDir });
    await (await import('./resources/updaters/prettierignore/index.mjs')).default({ projDir: u.projDir });
    await (await import('./resources/updaters/browserslist/index.mjs')).default({ projDir: u.projDir });
    await (await import('./resources/updaters/tsconfig/index.mjs')).default({ projDir: u.projDir });
    await (await import('./resources/updaters/wrangler/index.mjs')).default({ projDir: u.projDir });

    /**
     * Restores previous project directory.
     */
    await u.restoreProjDir();
};
