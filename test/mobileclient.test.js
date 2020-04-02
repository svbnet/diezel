const {MobileClient} = require('../index').clients;

const assert = require('assert');
const credentials = require('./temp/credentials');

describe('MobileClient', function() {
    const client = new MobileClient();

    describe('#signInWithEmail', async function() {
        it('returns false when signing in with incorrect credentials', async function() {
            const result = await client.signInWithEmail('bad', 'bad');
            assert.ok(!result);
        });

        it('signs in with correct credentials', async function() {
            await client.signInWithEmail(credentials.mail, credentials.password);
            assert.ok(client.signedIn);
        });
    });

    describe('#restoreSession', function() {
        it('restores a session from a previous client', async function() {
            const newClient = new MobileClient(client.userInfo);
            await client.restoreSession();
        });
    });
});