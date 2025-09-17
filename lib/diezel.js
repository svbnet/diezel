/**
 * Entry point for library
 */

const { copyKeys } = require('./key-store');

module.exports = {
    version: require('../package.json').version,
    setKeys: copyKeys,
    clients: require('./clients'),
    content: require('./content'),
    errors: require('./errors'),
};
