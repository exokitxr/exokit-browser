const VERSION = '0.0.0';

import { clamp, quadOut, degrees, quatFromDegrees } from './armature.utils.js';
import { NamedJointWrappers } from './NamedJointWrappers.js';
import Component from './ik.component.js';

const DefaultBias = {
  right: {
    shoulder: [-30,-120,0],
    arm: [-15,-0,-30],
    foreArm: [-15,-0,-30],
  },
  left: {
    shoulder: [30,120,0],
    arm: [15,0,-30],
    foreArm: [15,0,-30],
  },
};

const negateXY = new THREE.Vector3(-1,-1,1);

class Shoulders extends Component {
  constructor(rig, options) {
    options = options || {};
    super(rig, options);

    // FIXME: still being worked on; disabled since broken in current state
    this.enabled = false;

    this.options = options;
    this.bias = options.bias || Shoulders.DefaultBias;
    this._left = rig.getBone('LeftShoulder');
    this._right = rig.getBone('RightShoulder');
    Object.assign(this, new NamedJointWrappers(rig, {
      spine: 'Spine1',
    }));
    this.right = new NamedJointWrappers(rig, {
      shoulder: 'RightShoulder',
      arm: 'RightArm',
      foreArm: 'RightForeArm',
      hand: 'RightHand',
    }, this.bias.right);
    this.left = new NamedJointWrappers(rig, {
      shoulder: 'LeftShoulder',
      arm: 'LeftArm',
      foreArm: 'LeftForeArm',
      hand: 'LeftHand',
    }, this.bias.left);

    this.ease = quadOut;
    this.armLength = rig.backup.metrics.armLength;
  }

  tick(time, deltaTime) {
    if (!this.enabled) return false;
    if (this.debug) console.info('shoulders', time, deltaTime);
    if (this.debug && window.config) window.config.blah = this+'';
    var fraction = 0.15;
    this._tick(this.right, time, deltaTime, .01 + Math.min(1, fraction + this.rightCorrectionFactor)/5);
    this._tick(this.left, time, deltaTime, .01 + Math.min(1, fraction + this.leftCorrectionFactor)/5);
  }

  _deltaSpine(thing) {
    return thing.world.position
      .sub(this.spine.world.position)
      .applyQuaternion(this.spine.world.quaternion.inverse())
      .divideScalar(this.armLength);
  }
  get rightAmount() { return this._deltaSpine(this.right.hand).multiply(negateXY); }
  get leftAmount() { return this._deltaSpine(this.left.hand); }
  toString() {
    var ra = this.leftAmount;
    return [
      this.left.arm.degrees.x, 
      this.left.shoulder.degrees.x, 
      glm.vec3(this.leftAmount)+'',
      ra.x > .4 ? 'ok' : 'cross',
      this.rightCorrectionFactor,
    ].map((x)=>(isFinite(x)?x.toFixed(1):x))+'';
    return [
      this.right.arm.degrees.x, 
      this.right.shoulder.degrees.x, 
      glm.quat(this.rightArmDesired)+'',
      ra.x > .4 ? 'ok' : 'cross',
      this.rightCorrectionFactor,
    ].map((x)=>(isFinite(x)?x.toFixed(1):x))+'';
  }
  _isFrontSideCenter(forwardAmount) {
    return forwardAmount.x > 0.05 && Math.abs(forwardAmount.y) < .25 && forwardAmount.z > .05;
  }
  _getCorrectionFactor(forwardAmount) {
    if (this._isFrontSideCenter(forwardAmount)) return 0;
    return (1-Math.max(0,this.ease(forwardAmount.x+(Math.abs(forwardAmount.y)<.2?.5:0))));
    
  }
  get rightCorrectionFactor() { return this._getCorrectionFactor(this.rightAmount); }
  get leftCorrectionFactor() { return this._getCorrectionFactor(this.leftAmount); }

  _tick(right, time, deltaTime, fraction) {
    var dts = clamp(clamp(deltaTime, 1e-6, .2) * 60, 0, 1); // relative to 60fps
    var fdts = Math.max(.01, fraction * dts);
    //return;
    right.shoulder.quaternion.slerp(quatFromDegrees(right.shoulder.bias), fdts);
    fdts /= 2;
    right.arm.quaternion.slerp(quatFromDegrees(right.arm.bias), fdts);
    fdts /= 2;
    right.foreArm.quaternion.slerp(quatFromDegrees(right.foreArm.bias), fdts);
    right.foreArm.degrees.z = ((1-fdts) * right.foreArm.degrees.z + fdts * right.foreArm.bias[2]||0);

    if (this.locked) {
      right.foreArm.object.quaternion.copy(quatFromDegrees(right.foreArm.bias));
      right.arm.object.quaternion.copy(this.quatFromDegrees(right.arm.bias));
      right.shoulder.object.quaternion.copy(quatFromDegrees(right.shoulder.bias));
    }
    right.shoulder.object.updateMatrixWorld(true);
    // rightArm.object.quaternion.copy(rightArmDesired);
    // right.object.quaternion.copy(rightDesired);
    
  }
  
  get rightArmDesired() {
    // this.right.quaternion.slerp(quatFromDegrees(this.rightBias), fraction * dts);
    // this.rightArm.quaternion.slerp(quatFromDegrees(this.rightArmBias), fraction * dts);
    // if (fraction === 1) {
    //   this.right.quaternion.slerp(quatFromDegrees(this.rightBias), fraction * dts);
    //   this.rightArm.quaternion.slerp(quatFromDegrees(this.rightArmBias), fraction * dts);
    // }
    // if (this.rightBias.z) this.right.degrees.z = this.rightBias.z;
    //if (this.rightAggression)
    return quatFromDegrees(this.right.arm.bias);
  }
};

Shoulders.version = VERSION;
Shoulders.DefaultBias = DefaultBias;
export default Shoulders;

export { Shoulders, DefaultBias };