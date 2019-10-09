import { WorldHelper } from './SpaceHelpers.js';

export { Inversions, BindPoseExtractor, RelativeHelper };

class RelativeHelper {
  constructor(object, reference, order) {
    this.object = object;
    this.reference = reference || object.parent;
    this.world = new WorldHelper(object),
    this.origin = new WorldHelper(reference);
    this.local = this;
    this._euler = object.rotation.clone();
    if (order) this._euler.order = order;
    this._vec3 = new THREE.Vector3();
    this._vec3.toString = () => "("+this._vec3.toArray().map((x)=>x.toFixed(1))+")"+this._euler.order;
    this._quat = new THREE.Quaternion();
  }
  toString() { return `[RelativeHelper pos=${this.position} rot=${this.degrees}]`; }
  get uglyhack() {
    function absDupe(world) {
      var o = new THREE.Object3D();
      o.position.copy(world.position);
      o.quaternion.copy(world.quaternion);
      o.scale.copy(world.scale);
      return o;
    }
    var self = absDupe(this.world);
    var ref = absDupe(this.origin);
    self.parent = ref;
    return self;
  }
  get position() { return this.origin.position.sub(this.world.position); }
  get quaternion() { return this.origin.quaternion.inverse().multiply(this.world.quaternion); }
  getWorldQuaternion(target) { return target.copy(this.world.quaternion); }
  get rotation() { return this._euler.setFromQuaternion(this.quaternion); }
  get degrees() { return this._vec3.copy(this.rotation).multiplyScalar(THREE.Math.RAD2DEG); }
  get order() { return this._euler.order; }
  get length() { return this.position.length(); }

  get dir() { return this._vec3.set( 0, 0, -1 ).applyQuaternion( this.quaternion ); }
  
  rotateXdegrees(deg) { return this.rotate_degrees(deg, 'x') }
  rotateYdegrees(deg) { return this.rotate_degrees(deg, 'y') }
  rotateZdegrees(deg) { return this.rotate_degrees(deg, 'z') }
  rotate_degrees(deg, axis) {
    var e = new THREE.Euler();
    e[axis] = deg * THREE.Math.DEG2RAD;
    var rot = new THREE.Quaternion().setFromEuler(e);
    // var o = this.origin.quaternion;
    // var w = this.world.quaternion;
    var l = this.local.quaternion; // <-- we're working in this
    var r = this.object.quaternion; // <-- we want this
    var l2r = l.clone().inverse().multiply(r);
    return rot.multiply(l).multiply(l2r);
    //return l2r.multiply(rel);
    //return irot.multiply(krot.inverse()).multiply(rot).inverse();
  }
};

class BindPoseExtractor {
  constructor(skeleton) {
    this.skeleton = skeleton;

    this.quaternions = skeleton.bones.reduce((out, bone) => {
      out[bone.name] = bone.quaternion.clone(); return out;
    }, {});
    this.worldQuaternions = skeleton.bones.reduce((out, bone) => {
      out[bone.name] = bone.getWorldQuaternion(new THREE.Quaternion()); return out;
    }, {});
    this.worldPositions = skeleton.bones.reduce((out, bone) => {
      out[bone.name] = bone.getWorldPosition(new THREE.Vector3()); return out;
    }, {});
    this.rotations = skeleton.bones.reduce((out, bone) => {
      out[bone.name] = bone.rotation.clone(); return out;
      //out[bone.name].order = 'XYZ';
    }, {});
    this.planes = skeleton.bones.reduce((out, bone) => {
      out[bone.name] = this.getPlane(bone); return out;
    }, {});
  }
  _getJointTriplet(bone) {
    bone = typeof bone === 'string' ? this.skeleton.getBoneByName(bone) : bone;
    return bone ? [bone.parent, bone, bone.children[0]] : [];
  }
  getTripletWorldPoints(bone) {
    var abc = this._getJointTriplet(bone).filter(Boolean);
    return abc.length === 3 ? abc.map((x)=>x.getWorldPosition(new THREE.Vector3())): null;
  }
  getPlane(bone) {
    var abc = this.getTripletWorldPoints(bone);
    return abc && Object.assign(new THREE.Plane().setFromCoplanarPoints(abc[0], abc[1], abc[2]), { bones: this._getJointTriplet(bone) });
  }
};

class Inversions {
  constructor(from, to, orders={ x: 'XYZ', y: 'YXZ', z: 'ZYX' }) {
    this.from = from;
    this.to = to;
    this._x = new RelativeHelper(to, from, orders.x);
    this._y = new RelativeHelper(to, from, orders.y);
    this._z = new RelativeHelper(to, from, orders.z);
  }
  toString() { return `[Inversion X=${this.x.toFixed(1)} Y=${this.y.toFixed(1)} Z=${this.z.toFixed(1)}]`; }
  nudgeDegrees(axis, deg) { this['_'+axis].object.quaternion.copy(this['_'+axis]['rotate'+axis.toUpperCase()+'degrees'](deg)); }
  get X() { return this._x.degrees; }
  get Y() { return this._y.degrees; }
  get Z() { return this._z.degrees; }
  get x() { return this.X.x; }
  get y() { return this.Y.y; }
  get z() { return this.Z.z; }
  
  constrainMax(axis, inv = 1) {
    var ta = this[axis];
    if (ta > 0) this.nudgeDegrees(axis, inv * ta);
  }
  constrainMin(axis, inv = -1) {
    var ta = this[axis];
    if (ta < 0) this.nudgeDegrees(axis, inv * ta);
  }
  recenter(axis, inv = -1) {
    this.nudgeDegrees(axis, inv * this[axis]);
  }
  // limit(axis, min, max) {
  //   var ta = this[axis];
  //   //if (ta > max) this.nudgeDegrees(axis, -ta);
  //   if (ta > 0) this.nudgeDegrees(axis, -ta);
  // 
  // }
};
