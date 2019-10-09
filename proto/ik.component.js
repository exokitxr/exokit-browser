// placeholder base class for ik.components
class Component {
  constructor(rig, options = {}) {
    this.rig = rig;
    this.options = options || {};
    this.enabled = options.enabled !== false;
  }
  tick(time, deltaTime) { }
  preSolve(time, deltaTime) {}
  postSolve(time, deltaTime) {}
  toString() { return `[${this.constructor.name}]`; }
};

// import Component from './ik.component.js';
import { AutoIKChain, walkBoneChain } from './AutoIKChain.js';

class AutoIKComponent extends Component {
  constructor(rig, options) {
    super(rig, options);
    this.options = options;
    this.from = rig.getBone(options.from);
    this.to = rig.getBone(options.to);
    this.target = options.target;
    this.boneChain = walkBoneChain(this.from, this.to);
    this.ik = new AutoIKChain(this.boneChain.lineage, this.target, Object.assign(this.options, {
      preConstrain: (...args) => this.preConstrain(...args),
      postConstrain: (...args) => this.postConstrain(...args),
      backwardConstrain: (...args) => this.backwardConstrain(...args),
      forwardConstrain: (...args) => this.forwardConstrain(...args),
    }));
  }

  backwardConstrain(joint) {}
  forwardConstrain(joint) {}
  preConstrain(joint) {}
  postConstrain(joint) {}

  preSolve(time, deltaTime) {
    this.ik.preSolve(time, deltaTime);
  }
  tick(time, deltaTime) {
    this.ik.tick(time, deltaTime);
  }
  postSolve(time, deltaTime) {
    this.ik.postSolve(time, deltaTime);
    this.rig.config.backpropagate && this.ik.syncTail(time, deltaTime);
  }
};  

export default Component;
export { Component, AutoIKComponent };
