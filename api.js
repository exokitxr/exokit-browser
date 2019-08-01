const _fetchJson = u => fetch(u)
  .then(res => res.json());
const _pad64 = s => '0x' + '0'.repeat(64 - s.length) + s;
const _uint8ArrayToHex = uint8Array => Array.from(uint8Array).map(n => n.toString(16).padStart(2, '0')).join('');
const _hexToUint8Array = s => {
  const b = new Uint8Array(s.length/2);
  for (let i = 0; i < b.length; i++) {
    b[i] = parseInt(s.slice(i*2, i*2+2), 16);
  }
  return b;
};
const _encodeApps = apps => {
  let s = '0x';
  for (let i = 0; i < apps.length; i++) {
    const app = apps[i];
    const {appType, url, position, orientation} = app;

    s += appType === 'browser' ? '02' : '03';

    s += _uint8ArrayToHex(new TextEncoder().encode(url)) + '00';

    const positionArrayBuffer = new ArrayBuffer(3*Float32Array.BYTES_PER_ELEMENT);
    const positionFloat32Array = new Float32Array(positionArrayBuffer);
    for (let i = 0; i < positionFloat32Array.length; i++) {
      positionFloat32Array[i] = position[i];
    }
    s += _uint8ArrayToHex(new Uint8Array(positionArrayBuffer));

    const orientationArrayBuffer = new ArrayBuffer(4*Float32Array.BYTES_PER_ELEMENT);
    const orientationFloat32Array = new Float32Array(orientationArrayBuffer);
    for (let i = 0; i < orientationFloat32Array.length; i++) {
      orientationFloat32Array[i] = orientation[i];
    }
    s += _uint8ArrayToHex(new Uint8Array(orientationArrayBuffer));
  }
  return s;
};
const _decodeApps = s => {
  const result = [];

  let index = 0;
  index += 2; // 0x
  while (index < s.length) {
    const appTypeHex = s.slice(index, index+2);
    if (appTypeHex.length !== 2) {
      throw new Error('failed to parse app type');
    }
    const appType = appTypeHex === '02' ? 'browser' : 'volume';
    index += appTypeHex.length;

    const zeroIndex = s.indexOf('00', index);
    if (zeroIndex === -1) {
      throw new Error('failed to parse url');
    }
    const urlHex = s.slice(index, zeroIndex);
    const urlBuffer = _hexToUint8Array(urlHex);
    const url = new TextDecoder().decode(urlBuffer);

    index = zeroIndex + 2;

    const positionHexString = s.slice(index, index+3*4*2);
    if (positionHexString.length !== 3*4*2) {
      throw new Error('failed to parse position');
    }
    const positionUint8Array = _hexToUint8Array(positionHexString);
    const position = Array.from(new Float32Array(positionUint8Array.buffer, positionUint8Array.byteOffset, positionUint8Array.byteLength/Float32Array.BYTES_PER_ELEMENT));
    index += positionHexString.length;

    const orientationHexString = s.slice(index, index+4*4*2);
    if (orientationHexString.length !== 4*4*2) {
      throw new Error('failed to parse orientation');
    }
    const orientationUint8Array = _hexToUint8Array(orientationHexString);
    const orientation = Array.from(new Float32Array(orientationUint8Array.buffer, orientationUint8Array.byteOffset, orientationUint8Array.byteLength/Float32Array.BYTES_PER_ELEMENT));
    index += orientationHexString.length;

    const app = {
      appType,
      url,
      position,
      orientation,
    };
    result.push(app);
  }

  return result;
};
const _makeContracts = async web3 => {
  const [webaverseAbi, webaverseAddress, webasceneAbi, webasceneAddress] = await Promise.all([
    _fetchJson('./abis/webaverse.json'),
    _fetchJson('./addresses/webaverse.json'),
    _fetchJson('./abis/webascene.json'),
    _fetchJson('./addresses/webascene.json'),
  ]);
  return {
    webaverse: new web3.eth.Contract(webaverseAbi, webaverseAddress),
    webascene: new web3.eth.Contract(webasceneAbi, webasceneAddress),
  };
};
async function _execute(spec) {
  const _waitTransaction = txId => new Promise((accept, reject) => {
    const _recurse = () => {
      this.eth.getTransactionReceipt(txId, (err, result) => {
        if (!err) {
          if (result !== null) {
            accept(result);
          } else {
            _recurse();
          }
        } else {
          reject(err);
        }
      });
    };
    _recurse();
  });

  const {method, data} = spec;
  switch (method) {
    case 'send': {
      const {address, value, currency} = data;
      await this.eth.sendTransaction({from: this.eth.defaultAccount, to: address, value});
      break;
    }
    case 'mintTokenFromSignature': {
      const {addr, x, y, v, r, s} = data;
      const gas = await this.contracts.webaverse.methods.mintTokenFromSignature(addr, x, y, v, r, s).estimateGas({from: this.eth.defaultAccount});
      console.log('estimate gas', gas);
      const {transactionHash} = await this.contracts.webaverse.methods.mintTokenFromSignature(addr, x, y, v, r, s).send({from: this.eth.defaultAccount, gas});
      console.log('got txid', transactionHash);
      const rx = await _waitTransaction(transactionHash);
      console.log('got rx', rx);
      return rx;
      /* const result = await this.contracts.webascene.methods.getSceneByCoord(x, y).call();
      console.log('got scene id', parseInt(result[0], 10));
      return parseInt(result[0], 10); */
    }
    case 'getToken': {
      const {x, y} = data;
      const [tokenResult, sceneResult] = await Promise.all([
        this.contracts.webaverse.methods.getTokenByCoord(x, y).call(),
        this.contracts.webascene.methods.getSceneByCoord(x, y).call(),
      ]);
      const owner = tokenResult[0];
      const sceneId = parseInt(sceneResult[0], 10);
      const coords = (() => {
        if (sceneId) {
          const coordsData = sceneResult[1];
          const result = [];
          for (let i = 0; i < coordsData.length; i += 2) {
            result.push([parseInt(coordsData[i], 10), parseInt(coordsData[i+1], 10)]);
          }
          return result;
        } else {
          return [[x, y]];
        }
      })();
      const apps = (() => {
        if (sceneId) {
          const appsData = sceneResult[2];
          return appsData ? _decodeApps(appsData) : [];
        } else {
          return [];
        }
      })();
      if (coords.some(coord => coord[0] === 0 && coord[1] === 0)) {
        console.log('get scene', sceneResult, owner, coords, apps);
      }
      return {
        owner,
        id: parseInt(tokenResult[1], 10),
        x: parseInt(tokenResult[2], 10),
        y: parseInt(tokenResult[3], 10),
        lastTimestamp: parseInt(tokenResult[4], 10),
        scene: {
          id: sceneId,
          coords,
          apps,
          owner,
        },
        /* sceneId,
        scene: sceneId ? await _execute({
          method: 'getScene',
          data: {
            sceneId,
          },
        }) : null, */
      };
    }
    /* case 'getScene': {
      const {sceneId} = data;
      console.log('get scene 1', sceneId);
      const result = await this.contracts.webascene.methods.getSceneById(sceneId).call();
      console.log('get scene 2', result);
      return {
        id: parseInt(result[0], 10),
        coords: result[1],
        apps: result[2],
      };
    } */
    case 'setScene': {
      const {coords: coordsData, apps: appsData} = data;
      const coords = (() => {
        const result = Array(coordsData.length * 2);
        for (let i = 0; i < coordsData.length; i++) {
          const coord = coordsData[i];
          result[i*2] = new BigNumber(coord[0]);
          result[i*2 + 1] = new BigNumber(coord[1]);
        }
        return result;
      })();
      const apps = _encodeApps(appsData);
      console.log('set scene', coords, apps);
      const gas = await this.contracts.webascene.methods.setScene(coords, apps).estimateGas({from: this.eth.defaultAccount});
      const balance = await this.eth.getBalance(this.eth.defaultAccount);
      const {transactionHash} = await this.contracts.webascene.methods.setScene(coords, apps).send({from: this.eth.defaultAccount, gas});
      console.log('got txid', transactionHash);
      const rx = await _waitTransaction(transactionHash);
      console.log('got rx', rx);
      const result = await this.contracts.webascene.methods.getSceneByCoord(coords[0], coords[1]).call();
      console.log('got scene id', parseInt(result[0], 10));
      return parseInt(result[0], 10);
    }
    case 'setSceneApps': {
      const {sceneId, apps: appsData} = data;
      const apps = _encodeApps(appsData);
      console.log('set scene apps', sceneId, apps);
      const gas = await this.contracts.webascene.methods.setSceneApps(sceneId, apps).estimateGas({from: this.eth.defaultAccount});
      const balance = await this.eth.getBalance(this.eth.defaultAccount);
      const {transactionHash} = await this.contracts.webascene.methods.setSceneApps(sceneId, apps).send({from: this.eth.defaultAccount, gas});
      console.log('got txid', transactionHash);
      const rx = await _waitTransaction(transactionHash);
      console.log('got rx', rx);
      return rx;
    }
    default: throw new Error(`unknown execute method ${method}`);
  }
}
const getWeb3 = async () => {
  if (window.ethereum) {
    await window.ethereum.enable()
    const web3 = new window.Web3(window.ethereum);
    web3.eth.defaultAccount = window.ethereum.selectedAddress;
    web3.contracts = await _makeContracts(web3);
    web3.execute = _execute;
    return web3;
  } else {
    return null;
  }
};
const makeWeb3 = async (password = '', approve = () => Promise.reject()) => {
  const INFURA_API_KEY = 'ed32fe7667964c1398772a73c2426676';
  const rpcUrl = `https://rinkeby.infura.io/v3/${INFURA_API_KEY}`;
  const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
  const hash = ethUtil.sha3(password);
  const mnemonic = bip39.entropyToMnemonic(hash);
  const seed = bip39.mnemonicToSeedSync(mnemonic, '');
  const privateKey = '0x' + bip32.fromSeed(seed).derivePath("m/44'/60'/0'/0").derive(0).privateKey.toString('hex');
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);
  web3.eth.defaultAccount = account.address;
  web3.contracts = await _makeContracts(web3);
  web3.execute = async spec => {
    await approve(spec);
    return await execute(spec);
  };
  return web3;
};
