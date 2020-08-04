# Testing
You will need to create a Deezer account if you don't have one already, and make sure you have the keys, preferably at `lib/keys.json`.
Then, create a file named `credentials.js`:

    module.exports = {
        mail: 'your email address here',
        password: 'your password here',
    };


Testing is done using mocha. Simply run `npm test` to run all tests.

## `common.js`
Contains test IDs for certain things, which should be available in any region.
