const DEG2RAD = Math.PI/180;
const RAD2DEG = 180/Math.PI;
const ORDER = 'ZXY';

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
const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
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
  // Time,
  Mathf,
  // XRSettings,
  // Unity,
  Helpers,
};
