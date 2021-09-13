const assert = require('assert');

const { MobileClient } = require('../lib/diezel').clients;
const credentials = require('./credentials');
const common = require('./common');


describe('MediaClient', function() {
    let client, mediaClient;

    before(async function() {
        client = new MobileClient();
        await client.signInWithEmail(credentials.mail, credentials.password);
        mediaClient = client.mediaClient;
    });

    describe('#getMediaStreamInfo', function() {
        it('gets a song stream', async function() {
            const song = await client.getSong(common.testSong.id);
            const asset = await mediaClient.getMediaStreamInfo(song, 'MP3_128');
            assert.ok(asset.url);
        });
    });

});
