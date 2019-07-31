const _fetchJson = u => fetch(u)
  .then(res => res.json());
const _makeContract = async web3 => {
  const [abi, address] = await Promise.all([
    _fetchJson('./abi.json'),
    _fetchJson('./address.json'),
  ]);
  return new web3.eth.Contract(abi, address);
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
    case 'getToken': {
      const {x, y} = data;
      const result = await this.contract.methods.getTokenByCoord(x, y).call();
      const sceneId = parseInt(result[5], 10);
      return {
        owner: result[0],
        id: parseInt(result[1], 10),
        x: parseInt(result[2], 10),
        y: parseInt(result[3], 10),
        lastTimestamp: parseInt(result[4], 10),
        sceneId,
        scene: sceneId ? await _execute({
          method: 'getScene',
          data: {
            sceneId,
          },
        }) : null,
      };
    }
    case 'getScene': {
      const {sceneId} = data;
      const result = await contract.methods.getSceneById(sceneId).call();
      return {
        id: parseInt(result[0], 10),
        url: result[1],
      };
    }
    case 'mintTokenFromSignature': {
      const {addr, x, y, v, r, s} = data;
      const gas = await this.contract.methods.mintTokenFromSignature(addr, x, y, v, r, s).estimateGas({from: this.eth.defaultAccount});
      console.log('estimate gas', gas);
      const {transactionHash} = await this.contract.methods.mintTokenFromSignature(addr, x, y, v, r, s).send({from: this.eth.defaultAccount, gas});
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
    web3.contract = await _makeContract(web3);
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
  web3.contract = await _makeContract();
  web3.execute = async spec => {
    await approve(spec);
    return await execute(spec);
  };
  return web3;
};
