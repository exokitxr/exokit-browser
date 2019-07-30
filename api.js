const getWeb3 = async () => {
  if (window.ethereum) {
    await window.ethereum.enable()
    const web3 = new window.Web3(window.ethereum);
    web3.eth.defaultAccount = window.ethereum.selectedAddress;
    return web3;
  } else {
    return null;
  }
};
const makeWeb3 = password => {
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
  return web3;
};
