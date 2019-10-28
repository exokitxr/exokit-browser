const defaultIceServers = [
  {'urls': 'stun:stun.stunprotocol.org:3478'},
  {'urls': 'stun:stun.l.google.com:19302'},
];

function _randomString() {
  return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
}

class XRChannelConnection extends EventTarget {
  constructor(url) {
    super();

    this.rtcWs = new WebSocket(url);
    this.connectionId = _randomString();
    this.peerConnections = [];

    this.rtcWs.onopen = () => {
      // console.log('presence socket open');

      this.rtcWs.send(JSON.stringify({
        method: 'init',
        connectionId: this.connectionId,
      }));

      this.dispatchEvent(new CustomEvent('open'));
    };
    const _addPeerConnection = peerConnectionId => {
      let peerConnection = this.peerConnections.find(peerConnection => peerConnection.connectionId === peerConnectionId);
      if (peerConnection && !peerConnection.open) {
        peerConnection.close();
        peerConnection = null;
      }
      if (!peerConnection) {
        peerConnection = new XRPeerConnection(peerConnectionId);
        this.dispatchEvent(new CustomEvent('peerconnection', {
          detail: peerConnection,
        }));
        peerConnection.addEventListener('close', () => {
          const index = this.peerConnections.indexOf(peerConnection);
          if (index !== -1) {
            this.peerConnections.splice(index, 1);
          }
        });
        peerConnection.peerConnection.onicecandidate = e => {
          // console.log('ice candidate', e.candidate);

          this.rtcWs.send(JSON.stringify({
            dst: peerConnectionId,
            src: this.connectionId,
            method: 'iceCandidate',
            candidate: e.candidate,
          }));
        };
        this.peerConnections.push(peerConnection);

        if (this.connectionId < peerConnectionId) {
          peerConnection.peerConnection
            .createOffer()
            .then(offer => {
              peerConnection.peerConnection.setLocalDescription(offer);

              this.rtcWs.send(JSON.stringify({
                dst: peerConnectionId,
                src: this.connectionId,
                method: 'offer',
                offer,
              }));
            });
        }
      }
    };
    const _removePeerConnection = peerConnectionId => {
      const index = this.peerConnections.findIndex(peerConnection => peerConnection.connectionId === peerConnectionId);
      if (index !== -1) {
        this.peerConnections.splice(index, 1)[0].close();
      } else {
        console.warn('no such peer connection', peerConnectionId, this.peerConnections.map(peerConnection => peerConnection.connectionId));
      }
    };
    this.rtcWs.onmessage = e => {
      // console.log('got message', e.data);

      const data = JSON.parse(e.data);
      const {method} = data;
      if (method === 'join') {
        const {connectionId: peerConnectionId} = data;
        _addPeerConnection(peerConnectionId);
      } else if (method === 'offer') {
        const {src: peerConnectionId, offer} = data;

        const peerConnection = this.peerConnections.find(peerConnection => peerConnection.connectionId === peerConnectionId);
        if (peerConnection) {
          peerConnection.peerConnection.setRemoteDescription(offer)
            .then(() => peerConnection.peerConnection.createAnswer())
            .then(answer => {
              peerConnection.peerConnection.setLocalDescription(answer);

              this.rtcWs.send(JSON.stringify({
                dst: peerConnectionId,
                src: this.connectionId,
                method: 'answer',
                answer,
              }));
            });
        } else {
          console.warn('no such peer connection', peerConnectionId, this.peerConnections.map(peerConnection => peerConnection.connectionId));
        }
      } else if (method === 'answer') {
        const {src: peerConnectionId, answer} = data;

        const peerConnection = this.peerConnections.find(peerConnection => peerConnection.connectionId === peerConnectionId);
        if (peerConnection) {
          peerConnection.peerConnection.setRemoteDescription(answer);
        } else {
          console.warn('no such peer connection', peerConnectionId, this.peerConnections.map(peerConnection => peerConnection.connectionId));
        }
      } else if (method === 'iceCandidate') {
        const {src: peerConnectionId, candidate} = data;

        const peerConnection = this.peerConnections.find(peerConnection => peerConnection.connectionId === peerConnectionId);
        if (peerConnection) {
          peerConnection.peerConnection.addIceCandidate(candidate)
            .catch(err => {
              // console.warn(err);
            });
        } else {
          console.warn('no such peer connection', peerConnectionId, this.peerConnections.map(peerConnection => peerConnection.connectionId));
        }
      } else if (method === 'leave') {
        const {connectionId: peerConnectionId} = data;
        _removePeerConnection(peerConnectionId);
      } else {
        this.dispatchEvent(new MessageEvent('message', {
          data: e.data,
        }));
      }
    };
    this.rtcWs.onclose = () => {
      clearInterval(pingInterval);
      console.log('rtc closed');

      this.dispatchEvent(new CustomEvent('close'));
    };
    this.rtcWs.onerror = err => {
      console.warn('rtc error', err);
      clearInterval(pingInterval);

      this.dispatchEvent(new ErrorEvent('error', {
        message: err.stack,
      }));
    };
    const pingInterval = setInterval(() => {
      this.rtcWs.send(JSON.stringify({
        method: 'ping',
      }));
    }, 30*1000);
  }

  disconect() {
    this.rtcWs.close();
    this.rtcWs = null;

    for (let i = 0; i < this.peerConnections[i]; i++) {
      this.peerConnections[i].close();
    }
    this.peerConnections.length = 0;
  }

  send(s) {
    this.rtcWs.send(s);
  }

  update(hmd, gamepads) {
    for (let i = 0; i < this.peerConnections.length; i++) {
      const peerConnection = this.peerConnections[i];
      if (peerConnection.open) {
        peerConnection.update(hmd, gamepads);
      }
    }
  }
}
window.XRChannelConnection = XRChannelConnection;

class XRPeerConnection extends EventTarget {
  constructor(peerConnectionId) {
    super();

    this.connectionId = peerConnectionId;

    this.peerConnection = new RTCPeerConnection({
      iceServers: defaultIceServers,
    });
    this.open = false;

    this.peerConnection.ontrack = e => {
      console.log('got track', e);
    };

    const sendChannel = this.peerConnection.createDataChannel('sendChannel');
    this.peerConnection.sendChannel = sendChannel;
    let pingInterval = 0;
    sendChannel.onopen = () => {
      // console.log('data channel local open');

      this.open = true;
      this.dispatchEvent(new CustomEvent('open'));

      pingInterval = setInterval(() => {
        sendChannel.send(JSON.stringify({
          method: 'ping',
        }));
      }, 1000);
    };
    sendChannel.onclose = () => {
      // console.log('data channel local close');

      _cleanup();
    };
    sendChannel.onerror = err => {
      // console.log('data channel local error', err);
    };
    let watchdogTimeout = 0;
    const _kick = () => {
      if (watchdogTimeout) {
        clearTimeout(watchdogTimeout);
        watchdogTimeout = 0;
      }
      watchdogTimeout = setTimeout(() => {
        this.peerConnection.close();
      }, 5000);
    };
    _kick();
    this.peerConnection.ondatachannel = e => {
      const {channel} = e;
      // console.log('data channel remote open', channel);
      channel.onclose = () => {
        // console.log('data channel remote close');
        this.peerConnection.close();
      };
      channel.onerror = err => {
        // console.log('data channel remote error', err);
      };
      channel.onmessage = e => {
        // console.log('data channel message', e.data);

        const data = JSON.parse(e.data);
        const {method} = data;
        if (method === 'pose') {
          this.dispatchEvent(new CustomEvent('pose', {
            detail: data,
          }))
        } else if (method === 'ping') {
          // nothing
        } else {
          this.dispatchEvent(new MessageEvent('message', {
            data: e.data,
          }));
        }

        _kick();
      };
      this.peerConnection.recvChannel = channel;
    };
    this.peerConnection.close = (close => function() {
      _cleanup();

      return close.apply(this, arguments);
    })(this.peerConnection.close);
    const _cleanup = () => {
      if (this.open) {
        this.open = false;
        this.dispatchEvent(new CustomEvent('close'));
      }
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = 0;
      }
    };
  }

  close() {
    this.peerConnection.close();
  }

  send(s) {
    this.peerConnection.sendChannel.send(s);
  }

  update(hmd, gamepads) {
    this.send(JSON.stringify({
      method: 'pose',
      hmd,
      gamepads,
    }));
  }
}
window.XRPeerConnection = XRPeerConnection;