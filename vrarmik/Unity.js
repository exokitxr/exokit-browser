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

  get magnitude() {
    return this.length();
  }
  get normalized() {
    return this.clone().normalize();
  }
  Scale(a, b) {
    return new Vector3(a.x + b.x, a.y + b.y, a.z + b.z);
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

const Mathf = {
  Deg2Rad: DEG2RAD,
  Rad2Deg: RAD2DEG,
  PI: Math.PI,
  Clamp(v, min, max) {
    return Math.min(Math.max(v, min), max);
  },
  Clamp01(v) {
    return Mathf.Clamp(v, 0, 1);
  },
  Min(a, b) {
    return Math.min(a, b);
  },
  Max(a, b) {
    return Math.max(a, b);
  },
  Abs(v) {
    return Math.abs(v);
  },
  Lerp(a, b, t) {
    return a*(1-v) + b*v;
  },
  LerpAngle(a, b, t) {
    const num = Mathf.Repeat(b - a, 360);
    if (num > 180) {
      num -= 360;
    }
    return a + num * Mathf.Clamp01(t);
  },
  Floor(v) {
    return Math.floor(v);
  },
  Ceil(v) {
    return Math.ceil(v);
  },
  Repeat(t, length) {
    return t - Mathf.Floor(t / length) * length;
  },
  DeltaAngle(current, target) {
    let num = Mathf.Repeat(target - current, 360);
    if (num > 180) {
      num -= 360;
    }
    return num;
  },
  Acos(v) {
    return Math.acos(v);
  },
  Atan2(a, b) {
    return Math.atan2(a, b);
  },
  Sign(v) {
    return v >= 0 ? 1 : -1;
  },
  Pow(a, b) {
    return Math.pow(a, b);
  },
};

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
  Mathf,
  PlayerPrefs,
  XRSettings,
};
