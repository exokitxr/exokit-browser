pragma solidity ^0.5.10;

interface ERC721Metadata {
    // Required methods
    function totalSupply() external view returns (uint256 total);
    function balanceOf(address _owner) external view returns (uint256 balance);
    function ownerOf(uint256 _tokenId) external view returns (address owner);
    function approve(address _to, uint256 _tokenId) external;
    function transfer(address _to, uint256 _tokenId) external;
    function transferFrom(address _from, address _to, uint256 _tokenId) external;

    // Events
    event Transfer(address from, address to, uint256 tokenId);
    event Approval(address owner, address approved, uint256 tokenId);

    // Optional
    function name() external view returns (string memory _name);
    function symbol() external view returns (string memory _symbol);
    function tokenURI(uint256 _tokenId) external view returns (string memory);
    // function tokensOfOwner(address _owner) external view returns (uint256[] tokenIds);
    // function tokenMetadata(uint256 _tokenId, string _preferredTransport) public view returns (string infoUrl);

    // ERC-165 Compatibility (https://github.com/ethereum/EIPs/issues/165)
    function supportsInterface(bytes4 _interfaceID) external view returns (bool);
}

contract Webaverse is ERC721Metadata {
  /*** CONSTANTS ***/

  function strConcat(string memory _a, string memory _b) internal pure returns (string memory) {
    bytes memory _ba = bytes(_a);
    bytes memory _bb = bytes(_b);
    string memory ab = new string(_ba.length + _bb.length);
    bytes memory bab = bytes(ab);
    uint k = 0;
    for (uint i = 0; i < _ba.length; i++) bab[k++] = _ba[i];
    for (uint i = 0; i < _bb.length; i++) bab[k++] = _bb[i];
    return string(bab);
  }
  function uint2str(uint _i) internal pure returns (string memory _uintAsString) {
    if (_i == 0) {
        return "0";
    }
    uint j = _i;
    uint len;
    while (j != 0) {
        len++;
        j /= 10;
    }
    bytes memory bstr = new bytes(len);
    uint k = len - 1;
    while (_i != 0) {
        bstr[k--] = byte(uint8(48 + _i % 10));
        _i /= 10;
    }
    return string(bstr);
  }

  // string public constant name = "Webaverse";
  // string public constant symbol = "WEBAVERSE";

  function name() public view returns (string memory _name) {
    return "Webaverse";
  }
  function symbol() public view returns (string memory _symbol) {
    return "WEBV";
  }
  function tokenURI(uint256 tokenId) external view returns (string memory) {
    return strConcat('https://webaverse.com/t/', uint2str(tokenId));
  }

  bytes4 constant InterfaceID_ERC165 =
    bytes4(keccak256('supportsInterface(bytes4)'));

  bytes4 constant InterfaceID_ERC721 =
    bytes4(keccak256('name()')) ^
    bytes4(keccak256('symbol()')) ^
    bytes4(keccak256('totalSupply()')) ^
    bytes4(keccak256('balanceOf(address)')) ^
    bytes4(keccak256('ownerOf(uint256)')) ^
    bytes4(keccak256('approve(address,uint256)')) ^
    bytes4(keccak256('transfer(address,uint256)')) ^
    bytes4(keccak256('transferFrom(address,address,uint256)')) ^
    bytes4(keccak256('tokensOfOwner(address)'));


  /*** DATA TYPES ***/

  struct Token {
    uint256 id;
    int x;
    int y;
  } 
  struct TokenOwnership {
    uint256 tokenId;
    bool done;
  }

  /*** STORAGE ***/

  address[] public _owners;
  uint256 public tokenIds = 0;
  mapping (uint256 => Token) public tokens;
  mapping (uint256 => address) public tokenIndexToOwner;
  mapping (address => TokenOwnership[]) public ownerToTokenOwnership;
  mapping (uint256 => address) public tokenIndexToApproved;
  mapping (int => mapping(int => uint256)) public tokenCoordsToId;

  /*** EVENTS ***/

  // event Mint(address owner, uint256 tokenId);


  /*** INTERNAL FUNCTIONS ***/

  constructor() public {
    _owners.push(msg.sender);
  }
  
  function isOwner(address addr) internal view returns (bool) {
    for (uint i = 0; i < _owners.length; i++) {
      if (_owners[i] == addr) {
        return true;
      }
    }
    return false;
  }
  
  function addOwner(address newOwner) public {
    require(isOwner(msg.sender) && !isOwner(newOwner));
    _owners.push(newOwner);
  }
  
  function removeOwner(address oldOwner) external {
    require(isOwner(msg.sender) && isOwner(oldOwner));
    address[] memory newOwners = new address[](_owners.length - 1);
    uint j = 0;
    for (uint i = 0; i < _owners.length; i++) {
      if (_owners[i] != oldOwner) {
        newOwners[j++] = _owners[i];
      }
    }
    _owners = newOwners;
  }

  function _owns(address _claimant, uint256 _tokenId) internal view returns (bool) {
    return tokenIndexToOwner[_tokenId] == _claimant;
  }

  function _approvedFor(address _claimant, uint256 _tokenId) internal view returns (bool) {
    return tokenIndexToApproved[_tokenId] == _claimant;
  }

  function _approve(address _to, uint256 _tokenId) internal {
    tokenIndexToApproved[_tokenId] = _to;

    emit Approval(tokenIndexToOwner[_tokenId], tokenIndexToApproved[_tokenId], _tokenId);
  }

  function _mint(address owner, int x, int y) internal returns (uint256) {
    uint tokenId = ++tokenIds;
    tokens[tokenId] = Token({
      id: tokenId,
      x: x,
      y: y
    });
    tokenCoordsToId[x][y] = tokenId;

    // Mint(_owner, tokenId);

    _transfer(address(0), owner, tokenId);
    
    return tokenId;
  }

  function _transfer(address _from, address _to, uint256 _tokenId) internal {
    if (_from != address(0)) {
      TokenOwnership[] storage fromTokens = ownerToTokenOwnership[_from];
      for (uint i = 0; i < fromTokens.length; i++) {
        TokenOwnership storage tokenOwnership = fromTokens[i];
        if (tokenOwnership.tokenId == _tokenId) {
          tokenOwnership.done = true;
        }
      }
      delete tokenIndexToApproved[_tokenId];
    }
    
    TokenOwnership[] storage toTokens = ownerToTokenOwnership[_to];
    toTokens.push(TokenOwnership({
      tokenId: _tokenId,
      done: false
    }));
    tokenIndexToOwner[_tokenId] = _to;

    emit Transfer(_from, _to, _tokenId);
  }

  /*** ERC721 IMPLEMENTATION ***/

  function supportsInterface(bytes4 _interfaceID) external view returns (bool) {
    return ((_interfaceID == InterfaceID_ERC165) || (_interfaceID == InterfaceID_ERC721));
  }

  function totalSupply() public view returns (uint256) {
    return tokenIds;
  }

  function balanceOf(address owner) public view returns (uint256) {
    uint256 result = 0;
    TokenOwnership[] storage tokenOwnerships = ownerToTokenOwnership[owner];
    for (uint i = 0; i < tokenOwnerships.length; i++) {
      TokenOwnership storage tokenOwnership = tokenOwnerships[i];
      if (!tokenOwnership.done) {
        result++;
      }
    }
    return result;
  }

  function ownerOf(uint256 _tokenId) external view returns (address addr) {
    addr = tokenIndexToOwner[_tokenId];

    require(addr != address(0));
  }

  function approve(address _to, uint256 _tokenId) external {
    require(_owns(msg.sender, _tokenId));

    _approve(_to, _tokenId);
  }

  function transfer(address _to, uint256 _tokenId) external {
    require(_to != address(0));
    // require(_to != address(this));
    require(_owns(msg.sender, _tokenId));

    _transfer(msg.sender, _to, _tokenId);
  }

  function transferFrom(address _from, address _to, uint256 _tokenId) external {
    require(_to != address(0));
    // require(_to != address(this));
    require(_approvedFor(msg.sender, _tokenId));
    require(_owns(_from, _tokenId));

    _transfer(_from, _to, _tokenId);
  }

  function tokensOfOwner(address owner) external view returns (uint256[] memory) {
    uint256 balance = balanceOf(owner);

    if (balance == 0) {
      return new uint256[](0);
    } else {
      uint256[] memory result = new uint256[](balance);
      
      TokenOwnership[] storage tokenOwnerships = ownerToTokenOwnership[owner];
      for (uint i = 0; i < tokenOwnerships.length; i++) {
        TokenOwnership storage tokenOwnership = tokenOwnerships[i];
        if (!tokenOwnership.done) {
          result[i] = tokenOwnership.tokenId;
        }
      }

      return result;
    }
  }


  /*** OTHER EXTERNAL FUNCTIONS ***/

  function mintToken(address addr, int x, int y) external returns (uint256) {
    require(isOwner(msg.sender));
    uint256 tokenId = tokenCoordsToId[x][y];
    require(tokenId == 0);
    return _mint(addr, x, y);
  }
  
  function mintTokenFromSignature(address addr, int256 x, int256 y, uint8 v, bytes32 r, bytes32 s) external returns (uint256) {
    bytes32 m = keccak256(abi.encode(addr)) ^ keccak256(abi.encode(x)) ^ keccak256(abi.encode(y));
    require(ecrecover(m, v, r, s) == addr);
    uint256 tokenId = tokenCoordsToId[x][y];
    require(tokenId == 0);
    return _mint(addr, x, y);
  }
  
  function parseSignature(address addr, int256 x, int256 y, uint8 v, bytes32 r, bytes32 s) external pure returns
    (bytes memory a, bytes32 b, bytes memory c, bytes32 d, bytes memory e, bytes32 f, bytes32 g, address h) {
    a = abi.encode(addr);
    b = keccak256(a);
    c = abi.encode(x);
    d = keccak256(c);
    e = abi.encode(y);
    f = keccak256(e);
    g = b^d^f;
    h = ecrecover(g, v, r, s);
  }

  function getTokenById(uint256 _tokenId) external view returns (address owner, uint256 id, int x, int y) {
    Token storage token = tokens[_tokenId];

    owner = tokenIndexToOwner[_tokenId];
    id = token.id;
    x = token.x;
    y = token.y;
  }
  
  function getTokenByCoord(int xi, int yi) external view returns (address owner, uint256 id, int x, int y) {
    id = tokenCoordsToId[xi][yi];
    if (id != 0) {
        Token storage token = tokens[id];

        owner = tokenIndexToOwner[id];
        id = token.id;
        x = token.x;
        y = token.y;
    } else {
      owner = address(0);
      id = id;
      x = xi;
      y = yi;
    }
  }
}

/* interface ERC20 {
    function totalSupply() external view returns (uint);
    function balanceOf(address tokenOwner) external view returns (uint balance);
    function allowance(address tokenOwner, address spender) external view returns (uint remaining);
    function transfer(address to, uint tokens) external returns (bool success);
    function approve(address spender, uint tokens) external returns (bool success);
    function transferFrom(address from, address to, uint tokens) external returns (bool success);

    event Transfer(address indexed from, address indexed to, uint tokens);
    event Approval(address indexed tokenOwner, address indexed spender, uint tokens);
}

contract Webagen is ERC20 {
    struct Plan {
      uint256 price;
      uint256 award;
      uint256 trickle;
      uint256 length;
    }
    struct Subscription {
      uint256 id;
      address addr;
      uint256 timestamp;
      uint256 trickle;
      uint256 length;
      bool done;
    }
    
    string public constant name = "Webagen";
    string public constant symbol = "WGEN";
    uint8 public constant decimals = 18; // 18 is the most common number of decimal places

    address[] public _owners;
    Webaverse webaverse;
    mapping (address => uint256) balances;
    uint256 totalBalance = 0;
    mapping(uint256 => Subscription) subscriptions;
    mapping(address => uint256[]) addressToSubscriptionIds;
    uint256 subscriptionIds;
    mapping(address => mapping(address => uint256)) allowances;
    mapping(address => bytes) addressData;
    uint256 tokenPrice = 1*(10**18);
    mapping(string => Plan) plans;

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
      return a <= b ? a : b;
    }
    function max(uint256 a, uint256 b) internal pure returns (uint256) {
      return a >= b ? a : b;
    }

    constructor(address addr) public {
      _owners.push(msg.sender);
      webaverse = Webaverse(addr);
      plans['low'] = Plan({
        price: 20,
        award: 2*(10**18),
        trickle: 1653439153439, // 1s/1w
        length: 60*60*24*7*4
      });
      plans['medium'] = Plan({
        price: 25,
        award: 5*(10**18),
        trickle: 1653439153439, // 1s/1w
        length: 60*60*24*7*4
      });
      plans['high'] = Plan({
        price: 50,
        award: 11*(10**18),
        trickle: 1653439153439, // 1s/1w
        length: 60*60*24*7*4
      });
    }
  
    function _isOwner(address addr) internal view returns (bool) {
      for (uint i = 0; i < _owners.length; i++) {
        if (_owners[i] == addr) {
          return true;
        }
      }
      return false;
    }
  
    function addOwner(address newOwner) external {
      require(_isOwner(msg.sender) && !_isOwner(newOwner));
      _owners.push(newOwner);
    }

    function removeOwner(address oldOwner) external {
      require(_isOwner(msg.sender) && _isOwner(oldOwner));
      address[] memory newOwners = new address[](_owners.length - 1);
      uint j = 0;
      for (uint i = 0; i < _owners.length; i++) {
        if (_owners[i] != oldOwner) {
          newOwners[j++] = _owners[i];
        }
      }
      _owners = newOwners;
    }

    function setTokenPrice(uint256 newPrice) external {
      require(_isOwner(msg.sender));
      tokenPrice = newPrice;
    }
    
    function isSubscribed(address addr) public view returns (bool) {
      uint256[] storage _subscriptionIds = addressToSubscriptionIds[addr];
      for (uint i = 0; i < _subscriptionIds.length; i++) {
        Subscription storage subscription = subscriptions[_subscriptionIds[i]];
        if (!subscription.done) {
          return true;
        }
      }
      return false;
    }
    
    function _getCurrentSubscriptionBalance(uint subscriptionId) internal view returns (uint) {
      Subscription storage subscription = subscriptions[subscriptionId];
      return min(max(block.timestamp - subscription.timestamp, 0), subscription.length) * subscription.trickle;
    }
    
    function subscribe(address addr, string calldata planName) external payable {
      require(_isOwner(msg.sender));
      
      Plan storage plan = plans[planName];
      require(plan.price > 0 && msg.value == plan.price);

      balances[addr] += plan.award;

      uint subscriptionId = ++subscriptionIds;
      subscriptions[subscriptionId] = Subscription({
        id: subscriptionId,
        addr: addr,
        timestamp: block.timestamp,
        trickle: plan.trickle,
        length: plan.length,
        done: false
      });
      addressToSubscriptionIds[addr].push(subscriptionId);
    }
    
    function unsubscribe(address addr) external {
      require(_isOwner(msg.sender));

      uint256[] storage _subscriptionIds = addressToSubscriptionIds[addr];
      for (uint i = 0; i < _subscriptionIds.length; i++) {
        Subscription storage subscription = subscriptions[_subscriptionIds[i]];
        if (!subscription.done) {
          uint256 balanceCommited = _getCurrentSubscriptionBalance(subscription);
          balances[addr] += balanceCommited;
          totalBalance += balanceCommited;
          subscription.done = true;
        }
      }
    }
  
    function _getCurrentAddressBalance(address addr) internal view returns (uint256) {
      uint result = balances[addr];
      uint256[] storage _subscriptionIds = addressToSubscriptionIds[addr];
      for (uint i = 0; i < _subscriptionIds.length; i++) {
        Subscription storage subscription = subscriptions[_subscriptionIds[i]];
        if (!subscription.done) {
          result += _getCurrentSubscriptionBalance(subscription.id);
        }
      }
      return result;
    }
    
    function totalSupply() public view returns (uint) {
      uint result = totalBalance;
      for (uint subscriptionId = 1; subscriptionId <= subscriptionIds; subscriptionId++) {
        result += _getCurrentSubscriptionBalance(subscriptionId);
      }
      return result;
    }
    function balanceOf(address tokenOwner) public view returns (uint balance) {
        return _getCurrentAddressBalance(tokenOwner);
    }
    function allowance(address tokenOwner, address spender) public view returns (uint remaining) {
        return allowances[tokenOwner][spender];
    }
    function transfer(address to, uint tokens) public returns (bool success) {
      require(_getCurrentAddressBalance(msg.sender) >= tokens);
      balances[msg.sender] -= tokens;
      balances[to] += tokens;
      emit Transfer(msg.sender, to, tokens);
      return true;
    }
    function approve(address spender, uint tokens) public returns (bool success) {
        allowances[msg.sender][spender] = tokens;
        emit Approval(msg.sender, spender, tokens);
        return true;
    }
    function transferFrom(address from, address to, uint tokens) public returns (bool success) {
        require(msg.sender == from);
        return transfer(to, tokens);
    }
    
    function getAddressData(address addr) public view returns (bytes memory) {
      return addressData[addr];
    }
    
    function setAddressData(address addr, bytes calldata data) external {
      addressData[addr] = data;
    }
    
    function buyToken(int x, int y) external {
      if (balanceOf(msg.sender) >= tokenPrice) {
        balances[msg.sender] -= tokenPrice;
      }
      webaverse.mintToken(msg.sender, x, y);
    }

    event Transfer(address indexed from, address indexed to, uint tokens);
    event Approval(address indexed tokenOwner, address indexed spender, uint tokens);
} */

contract Webascene {
    struct Scene {
      uint256 id;
      int256[] coords;
      bytes apps;
    }

    address[] public _owners;
    uint256 public sceneIds = 0;
    mapping (uint256 => Scene) public scenes;
    mapping (uint256 => uint256) public tokenIdToSceneId;
    mapping (int256 => mapping (int256 => uint256)) public coordsToSceneId;
    uint256 tokenPrice = 5000000000000000; // 0.005 * 10e8 ETH = $1
    Webaverse webaverse;

    constructor(address addr) public {
      webaverse = Webaverse(addr);
      _owners.push(msg.sender);
    }
    
    function isOwner(address addr) internal view returns (bool) {
      for (uint i = 0; i < _owners.length; i++) {
        if (_owners[i] == addr) {
          return true;
        }
      }
      return false;
    }
    
    function addOwner(address newOwner) external {
      require(isOwner(msg.sender) && !isOwner(newOwner));
      _owners.push(newOwner);
    }

    function removeOwner(address oldOwner) external {
      require(isOwner(msg.sender) && isOwner(oldOwner));
      address[] memory newOwners = new address[](_owners.length - 1);
      uint j = 0;
      for (uint i = 0; i < _owners.length; i++) {
        if (_owners[i] != oldOwner) {
          newOwners[j++] = _owners[i];
        }
      }
      _owners = newOwners;
    }
    
    function setTokenPrice(uint256 newPrice) external {
      require(isOwner(msg.sender));
      tokenPrice = newPrice;
    }
    
    function getSceneById(uint256 _sceneId) external view returns (uint256 id, int256[] memory coords, bytes memory apps) {
      Scene storage scene = scenes[_sceneId];

      id = scene.id;
      coords = scene.coords;
      apps = scene.apps;
    }
    
    function getSceneByCoord(int256 x, int256 y) external view returns (uint256 id, int256[] memory coords, bytes memory apps) {
      uint sceneId = coordsToSceneId[x][y];
      Scene storage scene = scenes[sceneId];

      id = scene.id;
      coords = scene.coords;
      apps = scene.apps;
    }
    
    function ensurePayment() internal {
      require(msg.value >= tokenPrice);
    }
    
    function setScene(int256[] calldata coords, bytes calldata apps) external payable {
      ensurePayment();

      require((coords.length % 2) == 0);
      for (uint i = 0; i < coords.length; i += 2) {
        for (uint j = i+2; j < coords.length; j += 2) {
          require(!(coords[i] == coords[j] && coords[i+1] == coords[j+1]));
        }
      }
      uint sceneId = ++sceneIds;
      for (uint i = 0; i < coords.length; i += 2) {
        int256 x = coords[i];
        int256 y = coords[i+1];
        (address owner, uint256 tokenId, int x2, int y2) = webaverse.getTokenByCoord(x, y);
        x2;
        y2;
        require(owner == msg.sender);
        
        uint oldSceneId = tokenIdToSceneId[tokenId];
        if (oldSceneId != 0) {
          Scene storage oldScene = scenes[oldSceneId];
          for (uint j = 0; j < oldScene.coords.length; j += 2) {
            int256 x3 = oldScene.coords[j];
            int256 y3 = oldScene.coords[j+1];
            uint oldTokenId = webaverse.tokenCoordsToId(x3, y3);
            tokenIdToSceneId[oldTokenId] = 0;
            coordsToSceneId[x3][y3] = 0;
          }
        }
        tokenIdToSceneId[tokenId] = sceneId;
        coordsToSceneId[x][y] = sceneId;
      }
      scenes[sceneId] = Scene({
        id: sceneId,
        coords: coords,
        apps: apps
      });
    }
    
    function setSceneApps(uint256 sceneId, bytes calldata apps) external payable {
      ensurePayment();
        
      Scene storage scene = scenes[sceneId];
      for (uint i = 0; i < scene.coords.length; i += 2) {
        int256 x = scene.coords[i];
        int256 y = scene.coords[i+1];
        (address owner, uint256 tokenId, int x2, int y2) = webaverse.getTokenByCoord(x, y);
        tokenId;
        x2;
        y2;
        require(owner == msg.sender);
      }
      scene.apps = apps;
    }
    
    function buyToken(int x, int y, bytes calldata apps) external payable {
      ensurePayment();
      
      uint tokenId = webaverse.mintToken(msg.sender, x, y);
      uint sceneId = ++sceneIds;
      tokenIdToSceneId[tokenId] = sceneId;
      coordsToSceneId[x][y] = sceneId;
      int256[] memory coords = new int256[](2);
      coords[0] = x;
      coords[1] = y;
      scenes[sceneId] = Scene({
        id: sceneId,
        coords: coords,
        apps: apps
      });
    }
}
