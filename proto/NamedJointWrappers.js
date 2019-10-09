// NamedJointWrappers.js -- wraps a set of skeleton joints with SpaceHelper instances

import { SpaceHelper } from './SpaceHelpers.js';

class NamedJointWrappers {
	constructor(skeleton, map, biasmap) {
    if (skeleton.skeleton) skeleton = skeleton.skeleton;
    biasmap = biasmap || {};
    this.keys = Object.keys(map);
		for (var name in map) {
			var boneName = map[name];
      if (boneName === 'Armature') {
        this[name] = new SpaceHelper(skeleton.getBoneByName('Hips').parent, { boneName: boneName });
      } else {
        this[name] = new SpaceHelper(skeleton.getBoneByName(boneName), { boneName: boneName });
      }
      this[name].bias = biasmap[name] || biasmap[boneName];
		}
	}
  toString() { return `[NamedJointWrappers ${this.keys}]`; }
};

NamedJointWrappers.SpaceHelper = SpaceHelper;

export default NamedJointWrappers;
export { NamedJointWrappers };
try { Object.assign(self, { NamedJointWrappers }); } catch(e) {}