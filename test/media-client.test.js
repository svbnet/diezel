const assert = require('assert');

const { MobileClient } = require('../lib/diezel').clients;
const credentials = require('./credentials');
const common = require('./common');


describe('MediaClient', function() {
    this.timeout(10000);
    let client, mediaClient;

    before(async function() {
        client = new MobileClient();
        await client.signInWithEmail(credentials.mail, credentials.password);
        mediaClient = client.mediaClient;
    });

    describe('#getMediaStreamInfo', function() {
        it('gets a single song stream', async function() {
            const song = await client.getSong(common.testSong.id);
            const streams = await mediaClient.getSongStreams([song], ['MP3_128', 'MP3_320']);

            const stream = streams[song.SNG_ID];
            assert.ok(stream);
            assert.ok(stream.url);
            assert.ok(stream.song);
            assert.ok(stream.notBefore instanceof Date);
            assert.ok(stream.expiry instanceof Date);
            assert.strictEqual(stream.format, 'MP3_128');
            assert.strictEqual(stream.isFull, true);
            assert.strictEqual(stream.isProtected, true);
        });

        it('gets multiple songs streams', async function() {
            const songs = await Promise.all([common.testSong.id, common.testSong2.id, common.testSong3.id].map((id) => (client.getSong(id))));
            const streams = await mediaClient.getSongStreams(songs, ['MP3_128', 'MP3_320']);

            assert.strictEqual(Object.keys(streams).length, 3);
            songs.forEach((song) => {
                assert.ok(streams[song.SNG_ID]);
            });
        });
    });

});
