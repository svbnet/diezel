const crypto = require('crypto');

const initBlowfishPureLibrary = async () => {
  const { Blowfish } = await import ('egoroof-blowfish');
  const blowfishDecryptChunkPure = (key, iv, data) => {
    const bf = new Blowfish(key, Blowfish.MODE.CBC, Blowfish.PADDING.NULL);
    bf.setIv(iv);
    return Buffer.from(bf.decode(data, Blowfish.TYPE.UINT8_ARRAY));
  };
  return blowfishDecryptChunkPure;
};

const blowfishDecryptChunkOpenSsl = (key, iv, data) => {
  const bf = crypto.createDecipheriv('bf-cbc', key, iv).setAutoPadding(false);
  return Buffer.concat([bf.update(data), bf.final()]);
};

let library;

const getBlowfishLibrary = (callback) => {
  if (library) {
    callback(library);
    return;
  }

  if (crypto.getCiphers().includes('bf-cbc')) {
    library = { decryptChunk: blowfishDecryptChunkOpenSsl };
    callback(library);
  } else {
    initBlowfishPureLibrary().then((func) => {
      library = { decryptChunk: func };
      callback(library);
    }).catch(callback);
  }
}

module.exports = getBlowfishLibrary;
