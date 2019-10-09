// Armature.js -- base skeleton abstraction across a well-known joint topology (independent of mesh)

import { _decoupledSkeletonClone } from './armature.utils.js';
import remapJointNames from './remapJointNames.js';
import { NamedJointWrappers } from './NamedJointWrappers.js';
import { AutoIKChain, walkBoneChain } from './AutoIKChain.js';
import SkeletonMetrics from './SkeletonMetrics.js';

class Armature {
  static get version() { return '0.0.0a'; }
  constructor(skeleton, options) {
    this.options = options;
    this.skeleton = skeleton;
    this.originalSkeleton = _decoupledSkeletonClone(skeleton, new THREE.Group());
    this.bones = remapJointNames(this.skeleton, options.remapper);
    this.rootBone = this.bones.Hips;
    this.armatureObject = this.rootBone.parent;
    this.bones.Armature = this.bones.Armature || this.armatureObject;
    //this.bones.Armature.rotation.order = 'YXZ';
    this.bones.Hips.rotation.order = 'YXZ';
    this.bones.Head.rotation.order = 'YXZ';

    //this.armatureBone = 
    this.boneNames = Object.keys(this.bones);
    this.metrics = new SkeletonMetrics(skeleton);
    this.backup = _decoupledSkeletonClone(skeleton, new THREE.Group());
    this.backup.metrics = new SkeletonMetrics(this.backup);

    this.virtual = new THREE.Object3D();
    this.virtual.rotation.order = 'YXZ';
    
    const idNames = this.boneNames.reduce((out, x) => {
      out[x.replace(/^(.)(.*)$/, (_, ch, rest) => (ch.toLowerCase()+rest))] = x;
      return out;
    }, {});
    Object.assign(this, new NamedJointWrappers(skeleton, idNames));
  }

  walk(a, b, silent = false) {
    var bc = walkBoneChain(this.get(a), this.get(b));
    if (!silent && !bc.valid) {
        debugger;
        throw new Error('bad chain: '+[a,b].join('=>'));
    }
    return bc;
  }
  
  // experimental support for "tearing off" subskeleton chains
  virtualSegment(from, to) {
    var container = {
        name: 'virtualArmatureSegment',
        id: -1,
        uuid: -1,
      __proto__: new THREE.Object3D()
    };
    //var solo = _decoupledSkeletonClone(this.skeleton, new THREE.Group());
    var bc = this.walk(this.get(from), this.get(to));
    if (bc.head.parent) {
      bc.head.parent.getWorldPosition(container.position);
      bc.head.parent.getWorldQuaternion(container.quaternion);
      bc.head.parent.getWorldScale(container.scale);
      container.id = bc.head.parent.id;
      container.uuid = bc.head.parent.uuid;
    }
    var keep = bc.lineage.reduce(function(out, x){ out[x.uuid] = true; return out; }, {});
    //console.info('virtualSegment', keep, bc.lineage);
    var proxies = {};
    var byname = {};
    var vbones = this.skeleton.bones
      .map((x,i)=>{ return byname[x.name] = proxies[x.uuid] = {
        parent: keep[x.parent && x.parent.uuid] ? x.parent : container,
        $boneInverse: this.skeleton.boneInverses[i],
        __proto__: x,
      }})
     .filter((x)=>keep[x.uuid])
     .map((x) => {
       x.parent = proxies[x.parent && x.parent.uuid] || container;
       x.children = x.children.filter((c) => keep[c.uuid]).map((c)=>proxies[c.uuid]);
       if (x.parent === container) container.children.push(x);
       return x;
     })
    var vboneInverses = vbones.map((b)=>b.$boneInverse);
    //console.info('//virtualSegment', vbones.map((x)=>[x.name,x.children.length].join('#')));
    
    return Object.assign(new THREE.Skeleton(vbones, vboneInverses), {
      toString: function() { return `[PartialSkeleton head=${this.head.name} tail=${this.tail.name} bones=${this.bones.length}]`; },
      container: container,
      head: proxies[bc.head.uuid],
      tail: proxies[bc.tail.uuid],
      lineage: bc.lineage.map((x)=>proxies[x.uuid]),
    });
  }

  // helper methods
  get(name) {
    if (typeof name === 'string') return this.bones[name];
    if (name && name.isBone) return name;
    return null;
  }
  inv(name) {
    var i = this.skeleton.bones.indexOf(this.get(name));
    if (~i) { return this.skeleton.boneInverses[i]; }
    return null;
  }
  setInv(name, mat) {
    var i = this.skeleton.bones.indexOf(this.get(name));
    if (!~i) return null;
    this.skeleton.boneInverses[i].copy(mat);
  }
  setUnInv(name, mat) {
    var i = this.skeleton.bones.indexOf(this.get(name));
    if (!~i) return null;
    this.skeleton.boneInverses[i].copy(new THREE.Matrix4().getInverse(mat));
  }
  mat(name) {
    var i = this.skeleton.bones.indexOf(this.get(name));
    if (!~i) return null;
    return new THREE.Matrix4().copy({elements:this.skeleton.boneMatrices.slice(i*16, i*16+16)});
  }
  img(name) {
    var i = this.skeleton.bones.indexOf(this.get(name));
    if (!~i) return null;
    return new THREE.Matrix4().copy({elements:this.skeleton.boneTexture.image.data.slice(i*16, i*16+16)});
  }
  setMat(name, mat) {
    var i = this.skeleton.bones.indexOf(this.get(name));
    if (!~i) return null;
    for (var j=0; j < 16; j++) this.skeleton.boneMatrices[i*16+j] = mat.elements[j];
  }
  setImg(name, mat) {
    var i = this.skeleton.bones.indexOf(this.get(name));
    if (!~i) return null;
    for (var j=0; j < 16; j++) this.skeleton.boneTexture.image.data[i*16+j] = mat.elements[j];
  }
  getLocalRotation(name) {
    var bone = this.get(name);
    var orientation = bone.getWorldQuaternion(new THREE.Quaternion());
    var parentOrientation = bone.parent.getWorldQuaternion(new THREE.Quaternion());
    return parentOrientation.inverse().multiply(orientation);
  }
  getBindPose(name) {
    return this.backup[name];
  }
};

export default Armature;
export { Armature };
try { Object.assign(self, { Armature }); } catch(e) {}