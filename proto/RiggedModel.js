// RiggedModel.js -- extended IK Rig class with SkinnedMesh retargeting support

const VERSION = '0.0.1a';
console.info('RiggedModel...', VERSION);

import THREE from './ephemeral-three.js';
import Rig from './Rig.js';
import { fixSkeletonZForward } from './modified.AxisUtils.js';
import { extractSkeleton, quatFromDegrees } from './armature.utils.js';
import { BindPoseExtractor, RelativeHelper } from './experiments.js';

//import { IKHingeConstraint, IKBallConstraint } from './ephemeral-three-ik.js';

export default class RiggedModel extends Rig {
  static get version() { return VERSION; }
  static get DefaultTargets() { return [
    'Head', 'LeftHand', 'RightHand', 'Hips', 'LeftFoot', 'RightFoot'
  ]; }
  constructor(model, options) {
    options = options || {};
    options.targets = options.targets || createInternalIKTargets(
      RiggedModel.DefaultTargets, { $internal: true }
    );
    var base = extractSkeleton(model, options)
    super(base.skeleton, options);
    this.base = base;
    this.model = model;
    this.options = options;
    this.preRotations = this.options.preRotations || {};
    this.exclude = this.options.exclude || [];
    this.group = this.options.group || new THREE.Group();
    this.group.name = this.group.name || "(rebound-skeleton-group)";

    // ======== debug ========
    this.scene = this.debug = window.scene || (top.window.DEBUG && top.window.DEBUG.local('scene')); // TODO: remove
    if (this.debug && this.scene) {
      this.scene.add(this.boundsHelper = new THREE.BoxHelper( this.Armature.object, 0x003300 ));
      this.boundsHelper.parent = this.Armature.object;
    }
    // ======== /debug ========

    //model.updateMatrixWorld(true);
    //this._rebind()
    this._retargetSkeleton();
    this._rebindMeshes();
    this._reparentMeshes();

    this._initialPoses = new BindPoseExtractor(this.skeleton);
    this.armature.bones.toArray().map((bone)=> {
      bone.$relative = new RelativeHelper(bone.parent, bone, 'XYZ');
      Object.defineProperty(bone, 'logicalRotation', { 
        get: function() { return this.$relative.degrees; },
      });
    });
    this._initialPoses.logicalRotations = this.armature.bones.toArray().reduce((out, bone) => {
      out[bone.name] = bone.logicalRotation.clone(); return out;
    }, {});

    if (this.debug) {
      console.table(this._dbg_meshStats);
      console.table(this._dbg_rigStats);
    }
  }

  tick(time, deltaTime) {
    super.tick(time, deltaTime);
    // debugging
    if (window.poses) {
      Object.keys(window.poses).filter((name)=> this.poseBones[name])
        .forEach((name) => window.poses[name] = this.poseBones[name].logicalRotation);
    }
  }

  repose() {
    this.skeleton.pose();
    this.skeleton.calculateInverses();
    this.skeleton.update();
  }

  _parseRotationPatches(patchset) {
    const order = 'YXZ';
    var bones = this.armature.bones;
    var rotations = {};
    for (var p in patchset) {
      var rot = patchset[p].rotation || patchset[p];
      if (rot && isFinite(rot[0])) {
        var bone = bones[p];
        if (bone) {
          bone.$preRotation = rotations[bone.id] = quatFromDegrees(rot, order);
        } else console.warn('rotpatch: no bone named: '+p);
      } else console.warn('rotpatch: invalid rotation: '+[p, JSON.stringify(rot)]);
    }
    return rotations;
  }

  _retargetSkeleton() {
    var flip = this.preRotations.Armature;
    if (flip) {
      console.info('preRotating Armature...', flip);
      this.armature.armatureObject.quaternion.multiply(quatFromDegrees(flip.rotation || flip, 'YXZ'));
    }
    return fixSkeletonZForward(this.armature.rootBone, {
      preRotations: this._parseRotationPatches(this.preRotations),
      exclude: this.exclude,
    });
  }
  
  _rebindMeshes() {
    this.base.meshes.forEach((x) => x.bind(this.skeleton, this.bindMatrix));
  }

  _reparentMeshes(group = this.group) {
    // add meshes
    this.base.meshes.forEach((x) => group.add(x));
    // add internally-created IK targets
    for (var p in this.targets) {
      this.targets[p].$internal && group.add(this.targets[p]);
    }
    // recalculate overall bounds
    this.boundingBox = new THREE.Box3().setFromObject(this.group);
    return group;
  }

  // ========== debug helpers ======= 
  // produces { boneName: { preRotation, bindRotation }, ... }
  get _dbg_rigStats() {
    function xyzdeg(quat = new THREE.Quaternion(), order = 'YXZ') {
      if (!quat) return "n/a";
      var e = new THREE.Euler(0,0,0,order||quat.$order).setFromQuaternion(quat);
      return '['+e.toArray().slice(0,3).map((x)=>( x*THREE.Math.RAD2DEG ).toFixed(3)).join(', ')+']';//' // applied '+e.order;
    }
    return ['Armature', 'Hips','Head','LeftHand','RightHand'].reduce((stats, name) => {
      var bone = this.armature.bones[name];
      stats[name] = {
        //name: name,
        preRotation: xyzdeg(bone.$preRotation),
        bindRotation: xyzdeg(bone.quaternion),
      };
      return stats;
    }, {});
  }
  // produces { meshName: { #bones, #verts, bounds }, ... }
  get _dbg_meshStats() {
    return this.base.meshes.reduce((stats, x) => {
      var weights = x.geometry && x.geometry.attributes.skinWeight;
      var bounds = new THREE.Box3().setFromObject(x).getSize(new THREE.Vector3()).toArray().map((x)=>x.toFixed(1));
      stats[x.name || x.uuid] = {
        bones: x.skeleton && x.skeleton.bones.length,
        'weighted verts': (weights&&weights.count),
        bounds: '< '+bounds.join(', ')+' >',
      };
      return stats;
    }, {});
  }

  // toJSON() {
  //   return {
  //     type: 'rigged-model',
  //     bones: this.skeleton.bones.map((b) => {
  //       return {
  //         uuid: b.uuid,
  //         name: b.name,
  //         matrix: b.matrix,
  //         children: b.children.map((b) => b.uuid),
  //       };
  //     }),
  //     boneInverses: worker.skeleton.boneInverses,
  //   };
  // }

};

function createInternalIKTargets(names, props) {
  return names.reduce((out, c) => {
    out[c] = new THREE.Object3D();
    out[c].name = 'iktarget:' + c;
    Object.assign(out[c], props);
    return out;
  }, {});
}

export { RiggedModel, createInternalIKTargets };
try { Object.assign(window, { RiggedModel, createInternalIKTargets }); } catch (e) {}
console.info('//RiggedModel...', RiggedModel.version);
