// Feet placeholder component

const VERSION = '0.0.0';
import { AutoIKComponent, Component } from './ik.component.js';
import { AutoIKChain, walkBoneChain } from './AutoIKChain.js';

import { Feet as OldFeet } from './ik.component.Feet.js';
import ThreePointIK from './ThreePointIK.js';
import { RelativeHelper } from './experiments.js';

class Foot extends AutoIKComponent {
  static get version() { return VERSION; }
  constructor(rig, options) {
    super(rig, options);
    this.threep = new ThreePointIK(rig, {
      root: rig.armature.armatureObject,
      start: rig.getBone('Hips'),
      end: rig.getBone('Hips').parent,
      c: rig.getBone(this.to),
      b: rig.getBone(this.to.parent),
      a: rig.getBone(this.to.parent.parent),
      alpha: [0,0,.5],
    });
    
    var offset = options.offset || new THREE.Vector3(.1,0,-.01);
    if (/right/i.test(this.to.name)) offset.x *= -1;
    this.offset = this.rig.backup.metrics.bones[this.to.name].localToWorld(offset);
    this.hipsTarget = new RelativeHelper(this.rig.armature.armatureObject, this.to.parent);
    this.lscale = 1.0;
  
  }
  _constrainJoint(joint, eulerCB, options ) {
    options = options || { up: new THREE.Vector3(0,1,0), order: 'XYZ' };
    var to = joint.bone.parent.matrixWorld.clone();
    var from = to.clone().getInverse(to);
    var world = this.rig._initialPoses.worldQuaternions[joint.bone.name].clone();
    var prot = this.rig._initialPoses.worldQuaternions[joint.bone.parent.name].clone();
    //prot.copy(world.clone().inverse().multiply(prot.clone()));
    prot.copy(world.multiply(prot.clone().inverse()));//prot.clone().inverse()));
    //var prot = joint.bone.parent.getWorldQuaternion(new THREE.Quaternion());
    joint._direction.applyQuaternion(prot.clone().inverse());
    var blah = options.up || new THREE.Vector3(0,1,0);
    var quat = new THREE.Quaternion().setFromUnitVectors(blah, joint._direction);
    var tpl = new THREE.Euler(0,0,0, options.order || 'XYZ');
    var euler = tpl.clone().setFromQuaternion(quat);
    var logical = tpl.clone().setFromQuaternion(joint.bone.$relative.quaternion);
    var pose = tpl.clone().setFromQuaternion(this.rig._initialPoses.quaternions[joint.bone.name]);
    eulerCB(euler, { blah, quat, euler, logical, pose, to, from, prot, joint, bone:joint.bone });
    quat.setFromEuler(euler);
    joint._direction.copy(blah.clone().applyQuaternion(quat));
    joint._direction.applyQuaternion(prot.clone()).normalize();
  }
  backwardConstrain(joint) {
    var func = window[joint.bone.name];
    if (func) return this._constrainJoint(joint,func, func);
  }
  get desiredTargetPosition() {
    var off = this.offset.clone();
    if (this.rig.metrics.hips.y < .7) {
      off.x *= this.lscale;
    }
    var p = this.rig.armature.hips.world.position.sub(this.rig.armature.metrics.hipsOffset)
      .add(off.applyQuaternion(this.rig.armature.hips.world.quaternion));
    p.y = Math.max(0, p.y-.9);
    return p;
  }
  get desiredTargetQuaternion() { return this.hipsTarget.world.quaternion.clone().multiply(quatFromDegrees([0,0,0])); }

  preSolve(time, deltaTime) {
    this.threep.preSolve(time, deltaTime);
    if (this.rig.config.backpropagate) {
      this.target.position.lerp(this.desiredTargetPosition,.05);
      this.target.position.y = this.desiredTargetPosition.y;
    }
    super.preSolve(time, deltaTime);
    //this.rig.getIKTarget('RightFoot').position.copy(this.rig.armature.bones.Hips.position.clone().sub(new THREE.Vector3(0,-.5,0)));
  
  }
  tick(time, deltaTime) {
    this.threep.tick(time, deltaTime);
    super.tick(time, deltaTime);
  }
  postSolve(time, deltaTime) {
    this.threep.postSolve(time, deltaTime);
    //super.postSolve(time, deltaTime);
    if (this.rig.config.backpropagate) {
      this.target.quaternion.copy(this.desiredTargetQuaternion);
      this.target.position.lerp(this.desiredTargetPosition,.05);
    }
  }

};

class Feet extends Component {
  static get version() { return VERSION; }
  constructor(rig, options) {
    super(rig, options);
    // this.oldfeet = new OldFeet(rig, options);
    this.left = new Foot(rig, options.left);
    this.right = new Foot(rig, options.right);
    this._old = {};
    
    this.standHeight = .8
  }
  get standing() { return this.rig.metrics.hips.y > this.standHeight; }
  _upperLegs(alpha=1.0) {
    this.limit('LeftUpLeg', 'y', 'max');
    this.limit('RightUpLeg', 'y', 'min');
    this.limit('LeftUpLeg', 'z', [-.05,.05]);
    this.limit('RightUpLeg', 'z', [-.05,.05]);
    //this.limit('RightUpLeg', 'z', 0);
     //this.limit('LeftUpLeg', 'z', 0);
     this.limit('LeftLeg', 'z', null);
     this.limit('RightLeg', 'z', null);
    this.rig.poseBones.Hips.updateMatrixWorld(true);
  }
  _middleLegs(alpha=1.0) {
    this.limit('LeftLeg', 'z', null);
    this.limit('RightLeg', 'z', null);
    this.limit('LeftLeg', 'y', null);
    this.limit('RightLeg', 'y', null);
    this.limit('LeftLeg', 'x', 'max');
    this.limit('RightLeg', 'x', 'max');
    // this.limit('RightLeg', 'z', 0);
    // this.limit('LeftLeg', 'z', 0);
    this.rig.poseBones.Hips.updateMatrixWorld(true);
  }
  _lowerLegs(alpha=1.0) {
    this.limit('LeftFoot', 'z', null);
    this.limit('RightFoot', 'z', null);
    this.limit('LeftFoot', 'y', null);
    this.limit('RightFoot', 'y', null);
    this.limit('LeftFoot', 'x', null);
    this.limit('RightFoot', 'x', null);
    this.rig.poseBones.Hips.updateMatrixWorld(true);

  }
  preSolve(time, deltaTime) {
    // this.oldfeet.preSolve(time, deltaTime);
    if (this.rig.metrics.hips.y > .7) {
      this._upperLegs();
      this._middleLegs();
      this._lowerLegs();
    }
    this.left.lscale = this.right.lscale = this._offscale;
    this.left.preSolve(time, deltaTime);
    this.right.preSolve(time, deltaTime);
  }
  tick(time, deltaTime) {
    // this.oldfeet.tick(time, deltaTime);
    this.left.tick(time, deltaTime);
    this.right.tick(time, deltaTime);
  }
  _savecurrent() {
    this._old = {};
    for (var p in this.rig.poseBones) {
      this._old[p] = this.rig.poseBones[p].quaternion.clone();
    }
  }
  restPose(alphas=[1,1,1]) {
    if (!this._old.LeftLeg) return;
    [ this.rig.poseBones.LeftUpLeg, this.rig.poseBones.LeftLeg, this.rig.poseBones.LeftFoot ]
    .forEach((b, i,arr) => {
      b.quaternion.slerp(this._old[b.name], alphas[i]);
    });
    [ this.rig.poseBones.RightUpLeg, this.rig.poseBones.RightLeg, this.rig.poseBones.RightFoot ]
    .forEach((b, i,arr) => {
      b.quaternion.slerp(this._old[b.name], alphas[i]);
    });
  }
  kneelPose(alphas=[1,1,1]) {
    [ this.rig.poseBones.LeftUpLeg, this.rig.poseBones.LeftLeg, this.rig.poseBones.LeftFoot ]
    .forEach((b, i,arr) => {
      //b.rotation.set(0,0,0);
      b.quaternion.slerp(this.left.threep.output[b.name], alphas[i]);
    });
    [ this.rig.poseBones.RightUpLeg, this.rig.poseBones.RightLeg, this.rig.poseBones.RightFoot ]
    .forEach((b, i,arr) => {
      //b.rotation.set(0,0,0);
      b.quaternion.slerp(this.right.threep.output[b.name], alphas[i]);
    });
  }
  get _offscale() { 
    return clamp(this.rig.armature.hips.world.position.y,0.001,1);
    //return clamp((-this.standHeight)/this.standHeight, .01, 1);
  }
  postSolve(time, deltaTime) {
    // this.oldfeet.postSolve(time, deltaTime);
    this.left.postSolve(time, deltaTime);
    this.right.postSolve(time, deltaTime);
    var sk = Math.max(.01,this._offscale);
    if (!sk) debugger;
    //console.info('sk', sk);
    if (this.standing) {
      this.restPose([.01,.01,.01]);
      this._upperLegs(1-sk);
      this._middleLegs(1-sk);
       this._lowerLegs();
    } else {
      this.restPose([.5,.5,.5]);
      this.kneelPose([sk,sk,sk]);
    }
    this._savecurrent();
    
    //this.kneelPose([sk,sk,sk]);
    // this.rig.poseBones.LeftFoot.rotation.z=0;
    // this.rig.poseBones.RightFoot.rotation.z=0;
    // this.rig.poseBones.RightLeg.quaternion.slerp(this.right.threep.output.mid, .5);
  }

  limit(name, axis, mode, order) {
    var active = this.rig.poseBones;
    var old = this.rig._initialPoses.rotations;
    return limit(name, axis, mode, order);
    function limit(name, axis, mode, order) {
      if (order) active[name].rotation.order=order;
      var live = active[name].rotation[axis];
      var rotation = active[name].rotation.clone();
      
      var rest = old[name][axis];
      if (mode === null) {
        rotation[axis] = rest;
      } else if (Array.isArray(mode)) {
        rotation[axis] = clamp(live, rest + mode[0], rest + mode[1]);
        
      } else if (isFinite(mode)) {
        rotation[axis] = mode;//clamp(live, rest + mode[0], rest + mode[1]);
      } else {
        rotation[axis] = Math[mode](live, rest);
      }
      active[name].quaternion.slerp(new THREE.Quaternion().setFromEuler(rotation), .8);
    }
  }
  
}

export default Feet;
export { Foot, Feet };
