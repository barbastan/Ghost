// Google-specific utilities for the config module.

var _        = require('lodash'),
    minimist = require('minimist'),
    path     = require('path');


/**
 * Fetches a set of alternative configuration parameters that the caller can use to
 * override Ghost's default parameters.
 *
 * @return {object} - a config object suitable for passing to ConfigManager.set().
 *
 * The default configuration parameters for Ghost are specified by a config.js file in the
 * project's root directory.  This file defines a config object with top-level properties
 * that represent various runtime environments (e.g. production, development, testing).
 * Each environment property is an object consisting of one or more "stanza" properties that
 * represent different subsystems (e.g. server, database, mail).  Each stanza object is
 * a set of stanza-specific configuration parameter key-value pairs (e.g. the server
 * stanza has "host" and "port" properties that specify the IP address and port of the HTTP
 * server). Configuration properties can be primitive types, or they can be objects
 * containing subkey-value pairs, nested to an arbitrary depth.  (For a list of all available
 * configuration parameters, see http://support.ghost.org/config).
 *
 * Overrides for the default parameters can come from a variety of sources, namely:
 *   
 *   + the "config" property of the project's package.json file,
 *   + environment variables beginning with "ghost_",
 *   + parameters defined in .json or .js files whose pathnames are given as
 *     command-line arguments to "npm start --" or "node index",
 *   + parameters specified by double-dashed command-line options.
 *
 * Sources are listed above in order of increasing priority.  Thus, for example, an option
 * specified on the command line overrides one specified as an environment variable.
 *
 * Parameters from these alternative sources are independent of the runtime environment
 * and apply to whichever environment Ghost is running in.  There is currently no way to
 * specify different overrides for different environments.
 *
 * Parameters from these sources are specified as flat key-value pairs, where the hierarchy
 * required by Ghost is implied by hyphens in the keys.  The keys begin at the stanza level.
 * For example, to override the default {database: {connection: {password:}}} parameter, we
 * would use the key "database-connection-password".  Note that, in the case of parameters
 * specified by environment variables, underscores are used instead of hyphens to separate
 * parts of the key. Also note that the configuration parameters are case-sensitive.
 */
module.exports.getConfigOverrides = function () {

    // Get NPM configuration parameters and environment variables.  If the package.json file
    // contains a config: property, its value is a config object with properties that are
    // configuration parameters.  The "npm start" command places these properties into
    // environment variables with names of the form "npm_package_config_<parameter>", where
    // <parameter> is the name of the property from the config object with hyphens replaced
    // by underscores.  Here we find those environment variables, strip off the prefix from
    // the names, convert the underscores back into hyphens, and build an object with the
    // key-value pairs.  We also accept environment variables prefixed with with a case-
    // insensitive "ghost_", but please note that the parameter name itself is case-sensitive.
    // (Ghost uses camelcase for multiword parameter names).  The ghost_ environment variables
    // have higher priority than the npm_package_config ones.
    const envParams = _.assign.apply(undefined,
                                     _.map([/^npm_package_config_(.*)/, /^ghost_(.*)/i],
                                           function (p) {
                                               return _(process.env)
                                                   .pick(function (v, k) {
                                                       return p.test(k);
                                                   })
                                                   .map(function (v, k) {
                                                       return [p.exec(k)[1].replace(/_/g, '-'), v];
                                                   })
                                                   .object().value();
                                           }));

    // Get command-line configuration parameters.  Parameters can be specified via the
    // command line in two ways: by double-dashed option arguments or by regular arguments
    // that are pathnames of JSON or Javascript files.  If a relative pathname is given,
    // it is resolved relative to the directory from which the server was started.  The
    // extension of config files can be omitted; if both a .js and .json file exist, the
    // .js file takes precedence.
    const args = minimist(process.argv.slice(2)),
          jsonjsParams = _.assign.apply(undefined,
                                        _.map(args._,
                                              function (arg) {
                                                  const abspath = path.isAbsolute(arg)
                                                        ? arg
                                                        : path.join(process.cwd(), arg);
                                                  return require(abspath);
                                              })),
          optionParams = _.omit(args, '_');

    // Combine parameters from the various sources (listed below in order of increasing
    // priority).
    const params = _.assign({}, envParams, jsonjsParams, optionParams);
    
    // Convert each of the resulting key-value pairs into a nested object (as required by
    // Ghost), and return that object.  The caller is expected to use ConfigManager.set()
    // to merge the overrides with any existing configuration.
    return _.reduce(_.map(params,
                          function (v, k) {
                              return unflatten(k.split('-'), v);
                          }),
                    _.merge);
}


// Turns a list of keys and a value into a set of nested of key-value pairs.  For example,
// unflatten(['life', 'universe', 'everything'], 42) ==> {life: {universe: {everything: 42}}}.
function unflatten(keys, value) {
    return {[keys[0]]: keys.length === 1 ? value : unflatten(keys.slice(1), value)};
}
