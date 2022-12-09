/**
 * ESLint config file.
 *
 * @note ESLint is aware of this config file's location.
 *
 * @note CUSTOM EDITS ONLY PLEASE!
 * In the future this file will be updated automatically.
 * Only `<custom:start.../custom:end>` will be preserved below.
 */
/* eslint-env es2021, node */

const mc         = require( '@clevercanyon/js-object-mc' );
const baseConfig = require( './dev/.files/eslint/config.cjs' );

/**
 * Customizations
 * <custom:start> */

module.exports = mc.merge( {}, baseConfig, {} );

/** </custom:end> */
