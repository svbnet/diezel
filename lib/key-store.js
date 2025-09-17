const path = require('path');
const fs = require('fs');

const KEY_STORE_KEYS = ['TRACK_XOR_KEY', 'MOBILE_GW_KEY', 'MOBILE_API_KEY'];

const keys = {};
let triedInitFromFile = false;

const copyKeys = (newKeys) => {
    KEY_STORE_KEYS.forEach((name) => {
        if (newKeys[name] && !keys[name]) keys[name] = newKeys[name];
    });
    triedInitFromFile = true;
}

const initFromFile = () => {
    if (triedInitFromFile) return;

    try {
        const contents = fs.readFileSync(path.join(__dirname, 'keys.json'), 'utf8');
        copyKeys(JSON.parse(contents));
        console.warn('warning: using keys.json will be removed in a future release.');
    } catch (e) {
        if (e.code !== 'ENOENT') throw e;
    } finally {
        triedInitFromFile = true;
    }
};

const getKey = (key) => {
    if (keys[key]) return keys[key];

    const envVarName = `DIEZEL_${key}`;
    if (process.env[envVarName]) {
        keys[key] = process.env[envVarName];
        return keys[key];
    }

    initFromFile();

    if (keys[key]) return keys[key];
    throw new Error(`The key '${key}' is required but does not exist. You can specify it by calling setKeys or with the environment variable 'DIEZEL_${key}'.`);
};


module.exports = { copyKeys, getKey };
