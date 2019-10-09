var VERSION = '0.0.0';

import { clamp } from './armature.utils.js';
import Component from './ik.component.js';

class Feet extends Component {
  constructor(rig, options) {
    options = options || {};
    options.left = options.left || {};
    options.right = options.right  || {};
    super(rig, options);

    this.leftUpLeg = rig.getBone('LeftUpLeg');
    this.leftLeg = rig.getBone('LeftLeg');
    this.leftFoot = rig.getBone('LeftFoot');
    this.leftIKFoot = rig.getIKTarget(options.left.target || 'LeftFoot');
    this.rightUpLeg = rig.getBone('RightUpLeg');
    this.rightLeg = rig.getBone('RightLeg');
    this.rightFoot = rig.getBone('RightFoot');
    this.rightIKFoot = rig.getIKTarget(options.right.target || 'RightFoot');
    this.hips = rig.getBone('Hips');
    this.ihips = rig.backup.Hips;
    
    this.lastAngle = 0;
    
    this.t = Math.PI*-.7;
    this.s = Math.PI*-.4;
    this.u = Math.PI*.1;
  }
  tick(time, deltaTime) {
    var rig = this.rig;
    var h = rig.$hipsHeight;
    if (!h) h = this.hips.getWorldPosition(new THREE.Vector3()).y;
    var dist = (this.ihips.position.y-h-.05);
    var rotateAngle = clamp( Math.pow(dist,.5) * -90, -80, 0);
    if (rig.state.isLaying()) {
        rotateAngle = this.lastAngle = -15;
    }
    IKSolve.call(this, (10*this.lastAngle + rotateAngle)/11, this.leftUpLeg, this.leftLeg, this.leftFoot, this.leftIKFoot);
    IKSolve.call(this, (10*this.lastAngle + rotateAngle)/11, this.rightUpLeg, this.rightLeg, this.rightFoot, this.rightIKFoot);
    this.lastAngle = rotateAngle;
  }
}

// naive ground=>foot=>hips IK solver
function IKSolve(rotateAngle, _start, _mid, _end ) {
    if (!isNaN(rotateAngle)) {
        _start.rotation.x = rotateAngle * THREE.Math.DEG2RAD * 1.5;
        _start.rotation.x += this.s || 0;
        _start.rotation.y = _start.rotation.z = 0;
        _mid.rotation.y = _mid.rotation.z = 0;
        _mid.rotation.x = -_start.rotation.x * 1.5;//-2*rotateAngle * THREE.Math.DEG2RAD;
        _mid.rotation.x += this.t || 0;
        _end.rotation.y = _end.rotation.z = 0;
        _end.rotation.x = -Math.PI/2 - _mid.rotation.x/4;
        _end.rotation.x += this.u || 0;
    }
}

Feet.version = VERSION;
export { IKSolve, Feet };
export default Feet;
try { Object.assign(self, { IKSolve, Feet }); } catch(e) {}