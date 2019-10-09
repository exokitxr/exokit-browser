import { clamp } from './armature.utils.js';
import Component from './ik.component.js';

class RigState extends Component {
  static get version() { return '0.0.0'; }
  constructor(rig, initialState) {
    super(rig);
    this.state = initialState;
    this.$state = this.state;
    this.layHeight = .2;
  }
  tick(time, deltaTime) { }
  
  getNaturalHipsHeight() { return this.rig.backup.meta.hipsHeight; }
  getHipsHeight() { return this.rig.metrics.hipsHeight; }
  _pos(name) { return this.rig.getBone(name).getWorldPosition(new THREE.Vector3()); }
  _rot(name) { return this.rig.getBone(name).getWorldQuaternion(new THREE.Quaternion()); }
  _fwd(name) { return new THREE.Vector3(1, 0, 0).applyQuaternion(this._rot(name)); }
  getHandDisposition(hand) {
    var dir = this._pos('Spine1').sub(this._pos(hand)).normalize();
    var fwd = this._fwd('Spine1');
    return glm.degrees(glm.vec3(new THREE.Euler(0, 0, 0, 'ZXY').setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(dir, fwd))));
  }
  getAltitude() {
    //var standing = (this.getHipsHeight() / this.getNaturalHipsHeight());
    var standing = this.rig.metrics.altitude;
    return clamp(standing, -2, 2) * 100;
  }
  isKneeling() { return false; this.$state === 'kneeling' || this.isCrouching() || this.getAltitude() < 30; }
  isCrouching() { return false; this.$state === 'crouching' || this.isLaying() || this.getAltitude() < 10; }
  isLaying() { return false;this.$state === 'laying' || this.rig.metrics.altitude < this.layHeight; }
  getState() {
    return this.isLaying() ? 'laying' :
      this.isCrouching() ? 'crouching' :
      this.isKneeling() ? 'kneeling' : 'standing';
  }
  toString() {
    return this.getState();
  }
};

export default RigState;