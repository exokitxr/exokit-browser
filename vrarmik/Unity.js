class Transform {
  constructor() {
    this.position = new Vector3();
    this.rotation = new Quaternion();
    this.scale = new Vector3(1, 1, 1);
  }
}

const PlayerPrefs = {
  data: {},
  GetFloat(k, d) {
    let v = this.data[k];
    if (v === undefined) {
      v = d;
    }
    return v;
  },
  SetFloat(k, v) {
    this.data[k] = v;
  },
};

const XRSettings = {
  loadedDeviceName: 'OpenVR',
};

export {
  Transform,
  PlayerPrefs,
  XRSettings,
};
