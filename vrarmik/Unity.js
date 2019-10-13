const DEG2RAD = Math.PI/180;
const RAD2DEG = 180/Math.PI;

class Vector3 extends THREE.Vector3 {
  set(x, y, z) {
    super.set(x, y, z);
    this.onchange && this.onchange();
  }
  copy(p) {
    super.copy(p);
    this.onchange && this.onchange();
  }

  bindOnchange(onchange) {
    let x = this.x, y = this.y, z = this.z;
    Object.defineProperty(this, 'x', {
      get() {
        return x;
      },
      set(newX) {
        x = newX;
        onchange();
      },
    });
    Object.defineProperty(this, 'y', {
      get() {
        return y;
      },
      set(newY) {
        y = newY;
        onchange();
      },
    });
    Object.defineProperty(this, 'z', {
      get() {
        return z;
      },
      set(newZ) {
        z = newZ;
        onchange();
      },
    });
  }

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

class Quaternion extends THREE.Quaternion {
  set(x, y, z, w) {
    super.set(x, y, z, w);
    this.onchange && this.onchange();
  }
  copy(p) {
    super.copy(p);
    this.onchange && this.onchange();
  }

  bindOnchange(onchange) {
    let x = this.x, y = this.y, z = this.z, w = this.w;
    Object.defineProperty(this, 'x', {
      get() {
        return x;
      },
      set(newX) {
        x = newX;
        onchange();
      },
    });
    Object.defineProperty(this, 'y', {
      get() {
        return y;
      },
      set(newY) {
        y = newY;
        onchange();
      },
    });
    Object.defineProperty(this, 'z', {
      get() {
        return z;
      },
      set(newZ) {
        z = newZ;
        onchange();
      },
    });
    Object.defineProperty(this, 'w', {
      get() {
        return w;
      },
      set(newW) {
        w = newW;
        onchange();
      },
    });
  }

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
    this._position = new Vector3();
    this._rotation = new Quaternion();
    this._scale = new Vector3(1, 1, 1);

    this._localPosition = new Vector3();
    const localChange = this.localChange.bind(this);
    this._localPosition.bindOnchange(localChange);
    this._localRotation = new Quaternion();
    this._localRotation.bindOnchange(localChange);
    this._localScale = new Vector3(1, 1, 1);
    this._localScale.bindOnchange(localChange);

    this._parent = null;

    this._matrix = new THREE.Matrix4();
    this._matrixWorld = new THREE.Matrix4();
  }

  get position() {
    this.updateMatrixWorld();
    return this._position;
  }
  set position(position) {
    this._position.copy(position);
  }
  get rotation() {
    this.updateMatrixWorld();
    return this._rotation;
  }
  set rotation(rotation) {
    this._rotation.copy(rotation);
  }
  get scale() {
    this.updateMatrixWorld();
    return this._scale;
  }
  set scale(scale) {
    this._scale.copy(scale);
  }

  get localPosition() {
    return this._localPosition;
  }
  set localPosition(localPosition) {
    this._localPosition.copy(localPosition);
  }
  get localRotation() {
    return this._localRotation;
  }
  set localRotation(localRotation) {
    this._localRotation.copy(localRotation);
  }
  get localScale() {
    return this._localScale;
  }
  set localScale(localScale) {
    this._localScale.copy(localScale);
  }

  updateMatrixWorld() {
    if (this.matrixWorldNeedsUpdate) {
      this._matrix.compose(this._position, this._rotation, this._scale);
      this._matrixWorld.copy(this._matrix);

      if (t.parent) {
        t.parent.updateMatrixWorld();
        this._matrixWorld.premultiply(t.parent._matrixWorld);
      }

      this._matrixWorld.decompose(this._position, this._rotation, this._scale);

      this.matrixWorldNeedsUpdate = false;
    }
  }
  localChange() {
    this.matrixWorldNeedsUpdate = true;
  }

  get eulerAngles() {
    const e = new THREE.Euler().setFromQuaternion(this.rotation, 'ZXY');
    return new Vector3(e.x, e.y, e.z);
  }
  TransformPoint(v) {
    return v.applyMatrix4(new THREE.Matrix4().compose(this.position, this.rotation, this.scale));
  }
  InverseTransformPoint(v) {
    const m = new THREE.Matrix4().compose(this.position, this.rotation, this.scale);
    m.getInverse(m);
    return v.applyMatrix4(m);
  }
}

class GameObject {
  constructor(name) {
    this.name = name;
    this.transform = new Transform();
  }

  AddComponent(Constructor) {
    return new Constructor(this.transform);
  }
}

class MonoBehavior {
  constructor(transform = new Transform()) {
    this.transform = transform;
    this.components = new Map();
  }

  GetComponent(Constructor) {
    let component = this.components.get(Constructor);
    if (component === undefined) {
      component = new Constructor(this.transform);
      this.components.set(Constructor, component);
    }
    return component;
  }
  GetOrAddComponent(Constructor) {
    return this.GetComponent(Constructor);
  }
  GetComponentInChildren(Constructor) {
    return this.GetComponent(Constructor);
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
  GameObject,
  MonoBehavior,
  Mathf,
  PlayerPrefs,
  XRSettings,
};
