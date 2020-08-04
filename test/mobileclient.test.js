const assert = require('assert');

const { MobileClient } = require('../lib/diezel').clients;
const credentials = require('./credentials');
const common = require('./common');

describe('MobileClient', function() {
    const client = new MobileClient();

    describe('#signInWithEmail', async function() {
        it('returns false when signing in with incorrect credentials', async function() {
            const result = await client.signInWithEmail('bad', 'bad');
            assert.strictEqual(result, false);
            assert.strictEqual(client.signedIn, false);
        });

        it('signs in with correct credentials', async function() {
            await client.signInWithEmail(credentials.mail, credentials.password);
            assert.ok(client.signedIn);
        });
    });

    describe('#restoreSession', function() {
        it('restores a session from a previous client', async function() {
            const newClient = new MobileClient(client.userInfo);
            await newClient.restoreSession();
        });
    });

    describe('#getSong', function() {
        it('gets a song by ID', async function() {
            const expectedSong = common.testSong;
            const song = await client.getSong(expectedSong.id);
            assert.strictEqual(song.SNG_TITLE, expectedSong.title);
        });
    });

    describe('#getAlbum', function() {
        it('gets an album and tracks by ID', async function() {
            const expectedAlbum = common.testAlbum;
            const album = await client.getAlbum(expectedAlbum.id);
            assert.strictEqual(album.DATA.ALB_TITLE, expectedAlbum.title);
        });
    });
});