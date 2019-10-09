var VERSION = '0.0.0';

import { clamp, quadOut, degrees, quatFromDegrees } from './armature.utils.js';
import { NamedJointWrappers } from './NamedJointWrappers.js';
import Component from './ik.component.js';

const Z_AXIS = new THREE.Vector3(0,0,1);
const Y_AXIS = new THREE.Vector3(0,1,0);
const X_AXIS = new THREE.Vector3(1,0,0);
const Y_QUAT = quatFromDegrees([0,180,0]);

function __dir(q, axis=Z_AXIS) { return axis.clone().applyQuaternion(q); }
function __fwdquat(dir, axis=Z_AXIS) {
  return new THREE.Quaternion().setFromUnitVectors(dir, axis);
}
function __twist(a, b) { return Math.abs(180-a.angleTo(b) * THREE.Math.RAD2DEG); }

import { Inversions } from './experiments.js';

class Hips extends Component {
  static get version() { return VERSION; }
  constructor(rig, options) {
    options = options || {};
    super(rig, options);
    this.scene = this.debug = window.scene || (top.window.DEBUG && top.window.DEBUG.local('scene')); // TODO: remove
    this.options = options;
    if (options.followArms !== false) options.followArms = false;
    this.right = new NamedJointWrappers(rig, {
      shoulder: 'RightShoulder',
      arm: 'RightArm',
      foreArm: 'RightForeArm',
      hand: 'RightHand',
    });
    this.left = new NamedJointWrappers(rig, {
      shoulder: 'LeftShoulder',
      arm: 'LeftArm',
      foreArm: 'LeftForeArm',
      hand: 'LeftHand',
    });
    Object.assign(this, new NamedJointWrappers(rig, {
      head: 'Head',
      hips: 'Hips',
      spine: 'Spine',
      spine1: 'Spine1',
      neck: 'Neck',
    }));
    this.Armature = new NamedJointWrappers.SpaceHelper(rig.getBone('Hips').parent);

    this.hipsIK = new NamedJointWrappers.SpaceHelper(rig.getIKTarget('Hips'));
    this.headIK = new NamedJointWrappers.SpaceHelper(rig.getIKTarget('Head'));

    this.laybones = ['Spine','Spine1','Neck'].map((x)=>this.rig.getBone(x)).filter(Boolean);
    this.initial = undefined;//this.capture();
    this.state = undefined;
    
    this.minHeight = .25;
    this.minMovement = .05;
    
    this.hipsLockDegrees = 30;
    this.armLength = rig.backup.metrics.armLength;

    var pose = this.rig.armature.backup;
    var live = this.rig.armature.bones;

    this.centerInversions = {
      hips: new Inversions(pose.Hips, live.Head),
    };
    this.leftInversions = {
      upLeg: new Inversions(pose.Hips, live.LeftUpLeg),
      leg: new Inversions(pose.LeftUpLeg, live.LeftLeg),
    };
    this.rightInversions = {
      upLeg: new Inversions(pose.Hips, live.RightUpLeg),
      leg: new Inversions(pose.RightUpLeg, live.RightLeg),
    };
  }
  preSolve(time, deltaTime) {  }
  postSolve(time, deltaTime) {
    //this.debugOutput = this.centerInversions.hips+'';
  }
  capture() {
    return this.laybones.map((bone) => bone.quaternion.clone());
  }
  restore() {
    var initial = this.initial;
    this.initial = undefined;
    if (initial) {
      this.laybones.map((bone,i) => bone.quaternion.copy(initial[i]));
      //this.rig.skeleton.pose();
    }
  }
  tick(time, deltaTime, source) {
    return this._fallback(time, deltaTime, source || this.rig.targets);
  }
  
  get armsForwardDirection() {
    var dir = this.armsDirection;
    dir.y = 0;
    if (dir.z > 0) dir.z *= -1;
    return dir.normalize();
  }
  get armsForwardQuaternion() { return __fwdquat(this.armsForwardDirection, Z_AXIS); }
  get leftArmDir() { return this._bodyRelative(this.left.hand).position; }
  get rightArmDir() { return this._bodyRelative(this.right.hand).position; }
  get armsDirection() {
    var l = this.leftArmDir;
    var r = this.rightArmDir;
    this.debugOutput = l;
    return l.add(r).multiplyScalar(.5).normalize();
  }
  get relativeHeadQuaternion() { return this.relativeHeadIK.quaternion }
  get relativeDesiredDirection() { 
    var dir = __dir(this.options.followArms ?
        this.relativeHeadQuaternion.slerp(this.armsForwardQuaternion,.5) : 
        this.relativeHeadQuaternion);
    dir.y = 0;
    return dir.normalize();
  }
  get relativeDesiredQuaternion() { 
    return __fwdquat(this.relativeDesiredDirection, Z_AXIS).multiply(quatFromDegrees([0,0,0]));
  }

  _relativeTo(thing, a = this.Armature, flip) {
    var relative = new THREE.Object3D();
    relative.position.copy(a.worldToLocal(thing.getWorldPosition(new THREE.Vector3())));
    relative.quaternion.copy(a.world.quatTo(thing));
    if (flip) relative.quaternion.multiply(flip);
    relative.parent = a.object;
    return relative;
  }
  _armatureRelative(thing, a = this.Armature, flip) { return this._relativeTo(thing, a, flip); }
  _bodyRelative(thing, a = this.hips) { return this._relativeTo(thing, a); }

  get relativeHeadIK() { return this._armatureRelative(this.headIK); }

  get relativeDesiredHipsQuaternion() {
    var hh = this._bodyRelative(this.hips, this.head).quaternion.clone();
    var tmp = new THREE.Euler(0,0,0,'YXZ').setFromQuaternion(hh);
    tmp.x = 0;
    tmp.z = 0;
    //tmp.y *= -1;
    return new THREE.Quaternion().setFromEuler(tmp);
  }
  get localDesiredHipsQuaternion() {
    return this.relativeDesiredHipsQuaternion.multiply(quatFromDegrees([180,180,0]));
  }
  set debugOutput(nv) {
    if (!this.debug) return;
    try {
      if (typeof window === 'object' && window.debugOutElement) window.debugOutElement.innerText = nv+'';
    } catch(e) {}
  }
  //plump() { return this.rig.backup.metrics.head.y; }
  _fallback(time, deltaTime, source) {

    if (this.debug && this.scene && !this.xx) {
      this.xx = new THREE.AxesHelper();
      this.scene.add(this.xx);
      this.xx.parent = this.Armature.object;
    }
    if (this.xx) {
      this.xx.position.copy(this.armsForwardDirection);//this.relativeDesiredDirection.multiplyScalar(-1));
      this.xx.quaternion.copy(this.relativeDesiredQuaternion);
    }

    var rig = this.rig;
    var dts = clamp(clamp(deltaTime, 1e-6, .2) * 60, 0.01, 1); // relative to 60fps
    var plumb = new THREE.Vector3(0, this.relativeHeadIK.position.y - this.rig.backup.metrics.hipsOffset.y, 0);
    this.hips.position.lerp(plumb, .5 * dts);
    this.hips.quaternion.slerp(this.localDesiredHipsQuaternion, .5 * dts);//this.Armature.world.quaternion.inverse().multiply(this.hipsIK.quaternion),.15);//this.Armature.quaternion.clone().inverse())


    this.hipsIK.position.lerp(this.Armature.localToWorld(plumb.clone()), 1 * dts);
    this.hipsIK.quaternion.slerp(this.relativeDesiredHipsQuaternion, 1 * dts);

    this.rig.armature.virtual.quaternion.copy(this.headIK.world.quaternion.clone().multiply(this.hipsIK.quaternion.clone().inverse()));
    this.rig.armature.virtual.position.copy(this.headIK.world.position);//.clone().inverse()));


    //this.debugOutput = glm.quat(this.relativeDesiredQuaternion);
  }
  
};

export default Hips;