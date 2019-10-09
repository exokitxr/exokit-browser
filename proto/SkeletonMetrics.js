// SkeletonMetrics.js -- calculates various metrics about a given THREE Skeleton

import THREE from './ephemeral-three.js';

class SkeletonMetrics {
  static get version() { return '0.0.0'; }
  get scale() {
    return this.eyeHeight/1.6 * this.bones.Hips.parent.scale.x;
  }
  constructor(skeleton) {
    this.skeleton = skeleton;
    this.bones = this.skeleton.bones.reduce((out, b) => {
      out[b.name] = b;
      return out;
    }, {});
    this.boneNames = this.skeleton.bones.map((b)=>b.name);
  }
  get(name, fallback) {
    var b = name instanceof THREE.Bone ? name : this.bones[name] || this.bones[fallback];
    if (!b) throw new Error('!b:'+[name,fallback||'']);
    return b;
  }

  _pos(bone, target) { return bone.getWorldPosition(target); }
  _rot(bone, target) { return bone.getWorldQuaternion(target); }
  pos(name, fallback) {
    return this._pos(this.get(name, fallback), new THREE.Vector3());
  }
  rot(name, fallback) {
    return this._rot(this.get(name, fallback), new THREE.Quaternion());
  }
  centroid(names) {
    var center = new THREE.Vector3();
    for (let name of names) center.add(this.pos(name));
    return center.divideScalar(names.length);
  }
  // maybe LeftToeBase? or if lowest joint in skeleton is epsilon of zero, take feet to be at zero?
  get feet() { return this.pos('LeftFoot').add(this.pos('RightFoot')).multiplyScalar(.5); }
  get midEyes() { return this.pos('LeftEye').add(this.pos('RightEye')).multiplyScalar(.5); }
  get midHead() {
    var pt = this.pos('LeftEye').add(this.pos('RightEye')).multiplyScalar(.5);
    pt.z = this.pos('Head').z;
    return pt;
  }

  get headTop() { return this.pos('HeadTop_End', 'Head'); }
  get headPivot() { return this.pos('Head'); }
  get head() { return this.pos('Head'); }
  get hips() { return this.pos('Hips'); }

  get armLength() { return this.pos('LeftShoulder').sub(this.pos('LeftHand')).length(); }
  get legLength() { return this.pos('LeftUpLeg').sub(this.pos('LeftToeBase', 'LeftFoot')).length(); }

  get eyesOffset() { return this.midEyes.sub(this.headPivot); }
  get headOffset() { return this.midHead.sub(this.midEyes); }
  get cameraOffset() { return this.midEyes.sub(this.head); }
  get hipsOffset() { return this.midEyes.sub(this.hips); }

  //get height() { return this.headTop.y; }
  get lowestBone() { return this._mmbone(this.bones.Hips, -1).bone; }
  get highestBone() { return this._mmbone(this.bones.Hips, 1).bone; }
  _mmbone(root, dir) {
    var out = {
      root: root,
      dir: dir,
      bone: null,
      pos: dir < 0 ? new THREE.Vector3(Infinity, Infinity, Infinity) : new THREE.Vector3(-Infinity, -Infinity, -Infinity),
    };
    root.traverse((b)=> {
      var pt = this.pos(b);
      var better = dir < 0 ? (pt.y < out.pos.y) : (pt.y > out.pos.y);
      if (better) {
        out.bone = b;
        out.pos.copy(pt);
      }
    });
    return out;
  }

  get height() { return this.headTop.distanceTo(this.feet); }
  get eyeHeight() { return this.midEyes.distanceTo(this.feet); }

  get altitude() { return this.hips.y; }

  relativeTo(bone, names) {
    names = names || this.boneNames;
    var bones = names.map((x) => this.get(x));
    var inv = new THREE.Matrix4().getInverse(bone.matrixWorld);
    return bones.reduce((out, bone) => {
      out[bone.name] = this.pos(bone).applyMatrix4(inv);
      return out;
    }, {});
  }
};

export default SkeletonMetrics;
export { SkeletonMetrics };

try { Object.assign(self, { SkeletonMetrics }); } catch(e) {}