// Rig.js == base rigging class that comprehends joints across an Armature and helps coordinates IK integration

var VERSION = '0.0.0a';

import { clamp, getRelativeRotation } from './armature.utils.js';

import THREE from './ephemeral-three.js';

import Armature from './Armature.js';
import Head from './ik.component.Head.js';
import Hips from './ik.component.Hips.js';
import { Feet as OldFeet} from './ik.component.Feet.js';
import Feet2 from './ik.component.Feet2.js';
import Shoulders from './ik.component.Shoulders.js';
import Arms from './ik.component.Arms.js';
import RigState from './ik.component.State.js';

import { SpaceHelper } from './SpaceHelpers.js';

console.table && console.table({
  Rig: VERSION,
  RigState: RigState.version,
  Armature: Armature.version,
  Head: Head.version,
  Hips: Hips.version,
  Feet: Feet.version,
  Shoulders: Shoulders.version,
  Arms: Arms.version,
});

class Rig {
  static get version() { return VERSION; }

  constructor(skeleton, options, targets) {
    options = options || {};
    this.skeleton = skeleton;
    this.state = new RigState(this, 'standing');
    this.options = options;
    this.targets = targets || options.targets || { empty: true };
    this.config = Object.assign(options.config||{}, Object.assign({
      ik: true,
      backpropagate: true,
      grounding: true,
    }, options.config || {}));
    console.info('RIG', Rig.version, this.config);
    this.chains = options.chains || {};
    this.constraints = options.constraints || Rig.DefaultConstraints;

    this.armature = new Armature(this.skeleton, options);
    this.armature.armatureObject.updateMatrixWorld(true);
    this.armature.armatureObject.matrixAutoUpdate=false;
    this.armature.hips.matrixAutoUpdate=false;
    this.Armature = new SpaceHelper(this.armature.armatureObject);

    //skeleton.pose();
    //skeleton.calculateInverses();
    //skeleton.update();
    this.metrics = this.armature.metrics;
    this.backup = this.armature.backup;
    this.poseBones = this.armature.bones;

    this.scale = this.backup.metrics.scale;
    
    this.head = new Head(this, { from: 'Neck', to: 'Head', target: this.targets.Head });
    if (0) {
      this.feet = new OldFeet(this, {
        left: { name: 'LeftFoot', target: this.targets.LeftFoot },
        right: { name: 'RightFoot', target: this.targets.RightFoot },
      });
    } else {
      this.feet = new Feet2(this, {
        left: { from: 'LeftUpLeg', to: 'LeftFoot', target: this.targets.LeftFoot },
        right: { from: 'RightUpLeg', to: 'RightFoot', target: this.targets.RightFoot },
      });
    }
    this.hips = new Hips(this);
    this.shoulders = new Shoulders(this);
    this.arms = new Arms(this, {
      left: { from: 'LeftArm', to: 'LeftHand', target: this.targets.LeftHand },
      right: { from: 'RightArm', to: 'RightHand', target: this.targets.RightHand },
    });
    
    this.sync = {
      enabled: true,
      postSolve: (time, deltaTime) => {
        // coordinate world <=> armature <=> hips space
        this.syncReferenceFrames(time, deltaTime);
      },
    };
  }
  get components() { return [ this.head, this.hips, this.shoulders, this.arms, this.feet, this.state, this.sync ]; }
  get activeComponents() { return this.components.filter((x)=>x.enabled); }

  execute(method, ...args) {
    return this.activeComponents.map((component)=> (component[method] && component[method](...args)));
  }
  tick(time, deltaTime) {
    this.feet.enabled = this.config.grounding;
    //this.hips.enabled = this.config.fallback;
    if (this.config.ik) {
      for (const method of ['preSolve', 'tick', 'postSolve']) {
        this.execute(method, time, deltaTime);
      }
    }
  }
  syncReferenceFrames(time, deltaTime) {
    // FIXME: this ~works but Armature vs. hips vs. head compete and sometimes spaz out
    var p = this.armature.virtual.position;
    //console.info(p)
    //var tmp = this.armature.virtual.rotation.clone();
    this.Armature.position.set(p.x,0,p.z);
    var core = this.armature.armatureObject;
    var hips = this.armature.hips;
    var tmp = this.armature.virtual.rotation.clone();
    var b = core.quaternion.clone().inverse();
    tmp.x = tmp.z = 0;
    //tmp.y *= -1;
    core.rotation.copy(tmp);
    hips.quaternion.slerp(hips.quaternion.multiply(b.multiply(core.quaternion)), 1);
    hips.updateMatrix(true);
    hips.updateMatrixWorld(true);
    core.updateMatrix(true);
    core.updateMatrixWorld(true);
  }

  // _armatureRelative(thing) {
  //   var relative = new THREE.Object3D();
  //   relative.position.copy(this.$armature.worldToLocal(thing.getWorldPosition(new THREE.Vector3())));
  //   relative.quaternion.copy(this.$armature.world.quatTo(thing));
  //   relative.parent = this.$armature.object;
  //   return relative;
  // }

  getBone(name) { return this.armature.get(name); }
  getIKTarget(name) { return typeof name === 'string' ? this.targets[name] : name; }

  get iks() {
    return this.components.reduce((iks, c) => {
      return iks.concat([c.ik, c.left && c.left.ik, c.right && c.right.ik].filter((x)=>(x && x instanceof AutoIKChain)));
    }, []);
    }
  get ikJoints() {
    var ikJoints = [];
    this.iks.forEach((ik) => {
      ik && ik.joints && ik.joints.forEach((j) => {
        ikJoints.push(ikJoints[j.bone.name]=j);
      });
    });
    return ikJoints;
  }
};

export default Rig;
export { Rig };

