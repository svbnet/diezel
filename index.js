const MasterKeyProvider = require('./lib/crypto/master-key-provider');
// Try setting the keys from a keys.json file
try {
    MasterKeyProvider.setKeys(require('./keys.json'));
} catch (e) { }

const {MobileClient} = require('./lib/clients/mobileclient');
const {Cipher, Format} = require('./lib/clients/mediaclient');
const {SongAsset, LegacyFormat} = require('./lib/content/songasset');
const {ImageUrl, ImageFormat} = require('./lib/content/imageurl');

module.exports = {
    clients: {
        MobileClient,
        Cipher,
        Format,
    },
    content: {
        SongAsset,
        LegacyFormat,
        ImageUrl,
        ImageFormat,
    },
    setKeys: MasterKeyProvider.setKeys,
};
