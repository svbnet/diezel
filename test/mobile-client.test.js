const assert = require('assert');

const { MobileClient } = require('../lib/diezel').clients;
const credentials = require('./credentials');
const common = require('./common');

describe('MobileClient', function() {
    this.timeout(10000);

    let authenticatedClient;

    before(async function() {
        authenticatedClient = new MobileClient();
        await authenticatedClient.signInWithEmail(credentials.mail, credentials.password);
    });

    describe('#signInWithEmail', async function() {
        it('returns false and retains cleared state when signing in with incorrect credentials', async function() {
            const client = new MobileClient();
            const result = await client.signInWithEmail('bad', 'bad');
            assert.ok(!result);
            assert.ok(!client.signedIn);
            assert.ok(!client.mediaClient);
        });

        it('signs in successfully and sets state with correct credentials', async function() {
            const client = new MobileClient();
            const result = await client.signInWithEmail(credentials.mail, credentials.password);
            assert.ok(result);
            assert.ok(client.signedIn);
            assert.ok(client.mediaClient);
        });
    });

    describe('#signInWithUserInfo', function() {
        it('signs in with a UserInfo object and sets state with correct credentials', async function() {
            const newClient = new MobileClient();
            await newClient.signInWithUserInfo(authenticatedClient.userInfo);
            assert.ok(newClient.signedIn);
            assert.ok(newClient.mediaClient);
        });
    });

    describe('#restoreSession', function() {
        it('restores a session from a previous client', async function() {
            const newClient = new MobileClient(authenticatedClient.userInfo);
            await newClient.restoreSession();
            assert.ok(newClient.signedIn);
            assert.ok(newClient.mediaClient);
        });
    });

    describe('#getSong', function() {
        it('gets a song by ID', async function() {
            const expectedSong = common.testSong;
            const song = await authenticatedClient.getSong(expectedSong.id);
            assert.strictEqual(song.SNG_TITLE, expectedSong.title);
        });
    });

    describe('#getAlbum', function() {
        it('gets an album and tracks by ID', async function() {
            const expectedAlbum = common.testAlbum;
            const album = await authenticatedClient.getAlbum(expectedAlbum.id);
            assert.strictEqual(album.DATA.ALB_TITLE, expectedAlbum.title);
        });
    });

    describe('#retrieveAuthToken', function() {
        it('retrieves an anonymous auth token', async function() {
            const client = new MobileClient();
            const token = await client.retrieveAuthToken();
            assert.ok(!token.userId);
        });

        it('retrieves an authenticated auth token', async function() {
            const token = await authenticatedClient.retrieveAuthToken();

            assert.ok(token.userId);
        });
    });

    describe('#signOut', async function() {
        it('clears all session-related fields', async function() {
            const client = new MobileClient();
            await client.signInWithEmail(credentials.mail, credentials.password);

            await client.signOut();
            assert.ok(!client.signedIn);
            assert.ok(!client.mediaClient);
        });
    });
});
