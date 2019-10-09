// Head placeholder component

const VERSION = '0.0.0';
import { AutoIKComponent } from './ik.component.js';
import { AutoIKChain, walkBoneChain } from './AutoIKChain.js';

class Head extends AutoIKComponent {
  static get version() { return VERSION; }
  constructor(rig, options) {
    super(rig, options);
  }
  preSolve(time, deltaTime) {
    super.preSolve(time, deltaTime);
  }
  tick(time, deltaTime) {
      super.tick(time, deltaTime);
  }
  postSolve(time, deltaTime) {
    super.postSolve(time, deltaTime);
  }
};
export default Head;
export { Head };
try { Object.assign(self, { Head }); } catch(e) {}
