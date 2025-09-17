const assert = require('assert');
const { setTimeout } = require('node:timers/promises');

const FakeTimers = require('@sinonjs/fake-timers');

const { MobileClient } = require('../lib/diezel').clients;
const { AuthToken, AuthTokenError } = require('../lib/diezel').clients.authToken;
const credentials = require('./credentials');
const common = require('./common');


describe('AuthToken', function() {
    this.timeout(10000);
    let client, token;

    before(async function() {
        client = new MobileClient();
        await client.signInWithEmail(credentials.mail, credentials.password);
        token = await client.retrieveAuthToken();
    });

    describe('#needsRefresh', function() {
        it('returns false with a newly-obtained token', function() {
            assert.ok(!token.needsRefresh);
        });

        it('returns true when the token expires', function() {
            let clock;
            try {
                clock = FakeTimers.install({ now: token.decodedToken.exp * 1000 + 1000 });
                assert.ok(token.needsRefresh);
            } finally {
                clock?.uninstall();
            }
        })
    });

    describe('#refresh', function() {
        it('refreshes the token', async function() {
            const oldVal = token.jwtToken;
            // Let some time elapse
            await setTimeout(1000);
            await token.refresh();
            assert.notStrictEqual(oldVal, token.jwtToken);
        });

        it('does not refresh if there is no refresh token', async function() {
            const unrefreshableToken = new AuthToken();
            
            await assert.rejects(async () => {
                await unrefreshableToken.refresh();
            }, AuthTokenError);
        });
    });


    describe('#ensure', function() {
        it('does not refresh when the token is not expired', async function() {
            const oldVal = token.jwtToken;
            const newVal = await token.ensure();
            assert.strictEqual(oldVal, newVal);
        });

        // This causes the token.refresh() promise to never resolve
        // it('refreshes when the token has expired', async function() {
        //     let clock;
        //     try {
        //         clock = FakeTimers.install({ now: token.decodedToken.exp * 1000 + 1000 });
        //         const oldVal = token.jwtToken;
        //         const newVal = await token.ensure();
        //         assert.notStrictEqual(oldVal, newVal);
        //     } finally {
        //         clock?.uninstall();
        //     }
        // });
    });
});
