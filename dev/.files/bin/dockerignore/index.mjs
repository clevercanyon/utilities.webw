/**
 * `./.dockerignore` generator.
 *
 * @note PLEASE DO NOT EDIT THIS FILE!
 * @note This entire file will be updated automatically.
 * @note Instead of editing here, please review <https://github.com/clevercanyon/skeleton>.
 */

import fs from 'node:fs';
import path from 'node:path';
import { $is, $path, $str, $time } from '../../../../node_modules/@clevercanyon/utilities/dist/index.js';
import generatedRegExp from '../updater/data/generated-regexp.mjs';

export default async ({ projDir }) => {
    /**
     * Initializes vars.
     */
    const dockerIgnoreFile = path.resolve(projDir, './.dockerignore');

    /**
     * Defines ignore contents.
     */
    let dockerIgnoreFileContentsIgnores = $str.dedent(`
		# Last generated ${$time.i18n()}.
	`);
    for (const [groupName, group] of Object.entries($path.defaultNPMIgnoresByGroup())) {
        dockerIgnoreFileContentsIgnores += '\n\n# ' + groupName;

        if (!$is.array(group)) {
            for (const [subgroupName, subgroup] of Object.entries(group)) {
                dockerIgnoreFileContentsIgnores += '\n\n# » ' + subgroupName + '\n';

                for (const subgroupIgnore of subgroup) {
                    dockerIgnoreFileContentsIgnores += '\n' + subgroupIgnore;
                }
            }
        } else {
            dockerIgnoreFileContentsIgnores += '\n'; // Spacing.

            for (const groupIgnore of group) {
                dockerIgnoreFileContentsIgnores += '\n' + groupIgnore;
            }
        }
    }

    /**
     * Defines `./.dockerignore` file contents.
     */
    const oldFileContents = fs.readFileSync(dockerIgnoreFile).toString();
    const dockerIgnoreFileContents = oldFileContents.replace(
        generatedRegExp,
        ($_, $1, $2, $3) =>
            $1 + //
            '\n\n' +
            dockerIgnoreFileContentsIgnores +
            '\n\n' +
            $3,
    );

    /**
     * Compiles `./.dockerignore` file contents.
     */
    fs.writeFileSync(dockerIgnoreFile, dockerIgnoreFileContents);
};