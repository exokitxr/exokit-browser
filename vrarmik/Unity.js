const DEG2RAD = Math.PI/180;
const RAD2DEG = 180/Math.PI;

class Vector3 extends THREE.Vector3 {
  static get zero() {
    return new Vector3(0, 0, 0);
  }
  static get one() {
    return new Vector3(1, 1, 1);
  }
  static get right() {
    return new Vector3(1, 0, 0);
  }
  static get up() {
    return new Vector3(0, 1, 0);
  }
  static get forward() {
    return new Vector3(0, 0, 1);
  }

  get normalized() {
    return this.clone().normalize();
  }
  Dot(v) {
    return this.dot(v);
  }
  Cross(v) {
    return this.clone().cross(v);
  }
  Angle(v) {
    return this.angleTo(v) * RAD2DEG;
  }
}

class Quaternion extends THREE.Quaternion() {
  static get identity() {
    return new Quaternion(0, 0, 0, 1);
  }
  static AngleAxis(angle, axis) {
    return new Quaternion().setFromAxisAngle(axis, angle * DEG2RAD);
  }
  static FromToRotation(a, b) {
    return new Quaternion().setFromUnitVectors(a, b);
  }
  static Euler(v) {
    return new Quaternion().setFromEuler(new Euler(v.x, v.y, v.z, 'ZXY'));
  }

  Inverse() {
    return this.clone().inverse();
  }
}

class Transform {
  constructor() {
    this.position = new Vector3();
    this.rotation = new Quaternion();
    this.scale = new Vector3(1, 1, 1);
  }
  get eulerAngles() {
    const e = new THREE.Euler().setFromQuaternion(this.rotation, 'ZXY');
    return new Vector3(e.x, e.y, e.z);
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
  Vector3,
  Quaternion,
  Transform,
  PlayerPrefs,
  XRSettings,
};
