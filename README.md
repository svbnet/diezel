# Diezel
A library for the private Deezer API ("Gateway API") and other private APIs. By default, the library doesn't come with keys to decrypt audio streams, nor does it come with API access keys for the mobile API. You will have to find these yourself.

# Installation
Via [npm](https://www.npmjs.com/package/diezel):

```
npm install diezel
```

# Read This First
[See this for more info](https://gist.github.com/svbnet/b79b705a4c19d74896670c1ac7ad627e)

Due to Deezer's habit of sending DMCA requests to similar repositories, the keys that are hardcoded into various Deezer platforms are not included here.

| Key              | Explanation                                                                   |
| ---------------- | ----------------------------------------------------------------------------- |
| `TRACK_XOR_KEY`  | Key used to derive a decryption key for an encrypted song                     |
| `MOBILE_GW_KEY`  | **(MobileClient only)** Private key for decrypting an encrypted gateway token |
| `MOBILE_API_KEY` | **(MobileClient only)** API key for the mobile gateway API                    |

You can set the keys as soon as the library is required:

```js
const diezel = require('diezel');
diezel.setKeys(/* key object */);
```

Alternatively, you can also pass in keys through environment variables (with `DIEZEL_` prepended):

```
$ DIEZEL_TRACK_XOR_KEY=blahblah node
> const diezel = require('diezel');
```

# Which Client Should I Use?
For core Deezer services, Diezel implements a "mobile" client (as implemented in the Deezer mobile apps) and a "web" client (as implemented on the desktop site). Both clients have their advantages and disadvantages in terms of key availability.

## MobileClient
This is the most complete client that is currently implemented. Unlike many other implementations of the Deezer private API it doesn't rely on the web client for getting an SID or ARL. This means the user can sign in without having to pass a captcha. One major caveat of using this client is it requires two hardcoded keys - the API key, which is easily obtainable, and the gateway key, which is not. The client is already set up to impersonate an Android device so it would be wise to start there if you wish to obtain the keys.

## WebClient
This client is still a work in progress. It doesn't require any keys but it requires passing a captcha for logging in.

# Getting started with MobileClient
Once you have all the relevant keys:

```js
const diezel = require('diezel');
const { MobileClient } = diezel.clients;
const { ImageUrl, SongAsset, LegacyFormat } = diezel.content;

// Create client
const mobileClient = new MobileClient();

// Sign in
const result = await mobileClient.signInWithEmail('example@gmail.com', 'password')
if (result) {
    console.log('Signed in!');
} else {
    console.error('Incorrect credentials!');
}

// Restore session
const userInfo = mobileClient.userInfo;
// ...
const newClient = new MobileClient(userInfo);
await newClient.restoreSession();

// Get an album
const album = await mobileClient.getAlbum(122475762);

// Get album art URL
const albumArtUrl = ImageUrl.forObject(album.DATA).toString({dimensions: {width: 500, height: 500}});

// Get song stream
const song = album.SONGS.data[5];
const stream = await newClient.mediaClient.getSongStreams([song], ['MP3_128']);
const decryptedStream = await stream.getDecryptedStream();

// Pipe it to a file
const fs = require('fs');
const file = fs.openWriteStream('song.mp3');
decryptedStream.pipe(file);
```

# GraphQL API
Deezer have now implemented a new GraphQL API. While not included in this package, Diezel allows you to easily use it once authenticated using one of the above clients.
You can easily obtain the required authorization token of the currently signed in user:

```js
const diezel = require('diezel');
const { MobileClient } = diezel.clients;

// Create client
const mobileClient = new MobileClient();

// Sign in
await mobileClient.signInWithEmail('example@gmail.com', 'password');

// Get and print the auth token
const token = await mobileClient.retrieveAuthToken();
console.log(token.jwtToken);
```

Now, in conjunction with the base API URL `https://pipe.deezer.com/api`, it is possible to list all of the queries and mutations in a client like Postman.

# Testing
Testing requires that keys be present. See `readme.md` in the `test/` directory.

