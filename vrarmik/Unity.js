const DEG2RAD = Math.PI/180;
const RAD2DEG = 180/Math.PI;
const ORDER = 'ZXY';

class Vector3 extends THREE.Vector3 {
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
    this.set = (_set => function set() {
      _set.apply(this, arguments);
      onchange();
    })(this.set);
    this.copy = (_copy => function copy() {
      _copy.apply(this, arguments);
      onchange();
    })(this.copy);
  }

  static get zero() {
    return new Vector3(0, 0, 0);
  }
  static get one() {
    return new Vector3(1, 1, 1);
  }
  static get left() {
    return new Vector3(-1, 0, 0);
  }
  static get right() {
    return new Vector3(1, 0, 0);
  }
  static get up() {
    return new Vector3(0, 1, 0);
  }
  static get down() {
    return new Vector3(0, -1, 0);
  }
  static get forward() {
    return new Vector3(0, 0, 1);
  }
  static get back() {
    return new Vector3(0, 0, -1);
  }
  get magnitude() {
    return this.length();
  }
  get normalized() {
    return this.clone().normalize();
  }
  static Scale(a, b) {
    return new Vector3(a.x + b.x, a.y + b.y, a.z + b.z);
  }
  Scale(v) {
    return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
  }
  static Dot(a, b) {
    return a.dot(b);
  }
  static Cross(a, b) {
    return a.clone().cross(b);
  }
  static Angle(a, b) {
    return a.angleTo(b) * RAD2DEG;
  }
}

class Quaternion extends THREE.Quaternion {
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
    this.set = (_set => function set() {
      _set.apply(this, arguments);
      onchange();
    })(this.set);
    this.copy = (_copy => function copy() {
      _copy.apply(this, arguments);
      onchange();
    })(this.copy);
    /* this.setFromAxisAngle = (_setFromAxisAngle => function setFromAxisAngle() {
      _setFromAxisAngle.apply(this, arguments);
      onchange();
    })(this.setFromAxisAngle); */
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
    return new Quaternion().setFromEuler(new THREE.Euler(v.x * DEG2RAD, v.y * DEG2RAD, v.z * DEG2RAD, ORDER));
  }
  static Inverse(q) {
    return q.clone().inverse();
  }

  Inverse() {
    return this.clone().inverse();
  }
}

/* const Time = {
  deltaTime: 1/90,
}; */

const Mathf = {
  Deg2Rad: DEG2RAD,
  Rad2Deg: RAD2DEG,
  Order: ORDER,
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
  Log(a, b) {
    let result = Math.log(a);
    if (b !== undefined) {
      result /= Math.log(b);
    }
    return result;
  },
  Lerp(a, b, t) {
    return a*(1-v) + b*v;
  },
  LerpAngle(a, b, t) {
    let num = Mathf.Repeat(b - a, 360);
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

/* const XRSettings = {
  loadedDeviceName: 'OpenVR',
}; */

/* class Unity {
  constructor() {
    this.gameObjects = [];
  }

  makeGameObject(name) {
    const gameObject = new GameObject(name, this);
    this.gameObjects.push(gameObject);
    return gameObject;
  }

  clearAll() {
    this.gameObjects.length = 0;
  }
  startAll() {
    for (let i = 0; i < this.gameObjects.length; i++) {
      this.gameObjects[i].components.forEach(value => {
        value.Awake && value.Awake();
      });
    }
    for (let i = 0; i < this.gameObjects.length; i++) {
      this.gameObjects[i].components.forEach(value => {
        value.OnEnable && value.OnEnable();
      });
    }
    for (let i = 0; i < this.gameObjects.length; i++) {
      this.gameObjects[i].components.forEach(value => {
        value.Start && value.Start();
      });
    }
  }
  updateAll() {
    for (let i = 0; i < this.gameObjects.length; i++) {
      this.gameObjects[i].components.forEach(value => {
        value.Update && value.Update();
      });
    }
    for (let i = 0; i < this.gameObjects.length; i++) {
      this.gameObjects[i].components.forEach(value => {
        value.LateUpdate && value.LateUpdate();
      });
    }
  }
} */
const localVector = new Vector3();
const localVector2 = new Vector3();
const Helpers = {
  getWorldPosition(o, v) {
    return v.setFromMatrixPosition(o.matrixWorld);
  },
  getWorldQuaternion(o, q) {
    o.matrixWorld.decompose(localVector, q, localVector2);
    return q;
  },
  getWorldScale(o, v) {
    return v.setFromMatrixScale(o.matrixWorld);
  },
  updateMatrix(o) {
    o.matrix.compose(o.position, o.quaternion, o.scale);
  },
  updateMatrixWorld(o) {
    o.matrixWorld.multiplyMatrices(o.parent.matrixWorld, o.matrix);
  },
  updateMatrixMatrixWorld(o) {
    o.matrix.compose(o.position, o.quaternion, o.scale);
    o.matrixWorld.multiplyMatrices(o.parent.matrixWorld, o.matrix);
  },
};

export {
  Vector3,
  Quaternion,
  // Time,
  Mathf,
  // XRSettings,
  // Unity,
  Helpers,
};
