import { SpaceHelper } from './SpaceHelpers.js';
import { RelativeHelper } from './experiments.js';
import Component from './ik.component.js';

class ThreePointIK extends Component {
  constructor(rig, options) {
    options = options || {};
    super(rig, options);

    if (!options.root) throw new Error('missing option .root');
    this.root = new SpaceHelper(options.root);
    ['start','a','b','c','end'].forEach((p)=> {
      var obj = options[p];
      if (!obj) throw new Error('missing option: ' + p);
      this[p] = new RelativeHelper(obj, this.root);
      obj.rotation.order = options.order || 'XYZ';
    });
    this.abcLength = this.c.world.position.sub(this.b.world.position).add(this.b.world.position.sub(this.a.world.position)).length();
    
    this.lastAngle = 0;
    this.scale = options.scale || .5;
    
    this.t = Math.PI*-.7;
    this.s = Math.PI*-.4;
    this.u = Math.PI*.1;
    
    this.output = {
      start: new THREE.Quaternion(),
      mid: new THREE.Quaternion(),
      end: new THREE.Quaternion(),
      get a() { return new THREE.Euler(0,0,0,'XYZ').setFromQuaternion(this.start); },
      get b() { return new THREE.Euler(0,0,0,'XYZ').setFromQuaternion(this.mid); },
      get c() { return new THREE.Euler(0,0,0,'XYZ').setFromQuaternion(this.end); },
    };
    this.output[this.a.object.name] = this.output.start;
    this.output[this.b.object.name] = this.output.mid;
    this.output[this.c.object.name] = this.output.end;
      
    this.alpha = options.alpha || [0,0,0];
  }
  get length() {
    return (this.start.world.position.y-this.end.world.position.y)*this.scale;
  }
  get plength() {
    return this.length/this.abcLength;
  }
  get rotationAngleDegrees() {
    var dist = this.abcLength - this.length;
    return clamp( Math.pow(dist,.5) * -90, -80, 0);
    // return clamp( this.plength * -90, 0, 80) || 0;
  }
  tick(time, deltaTime) {
    var rig = this.rig;
    var rotateAngle = this.rotationAngleDegrees;
    // var rotateAngle = clamp( Math.pow(dist,.5) * -90, -80, 0);
    // if (rig.state.isLaying()) {
    //     rotateAngle = this.lastAngle = -15;
    // }
    // var rotateAngle = this.rotationAngleDegrees;
    //window.config.blah = [this.plength, rotateAngle].map((x)=>x.toFixed(3))+'';
    this._solution((10*this.lastAngle + rotateAngle)/11);
    this.lastAngle = rotateAngle;
  }
  postSolve(time, deltaTime) {
    if (this.alpha[0]) this.a.object.quaternion.slerp(this.rig._initialPoses.quaternions[this.a.object.name], this.alpha[0]||0);
    if (this.alpha[1]) this.b.object.quaternion.slerp(this.rig._initialPoses.quaternions[this.b.object.name], this.alpha[1]||0);
    if (this.alpha[2]) this.c.object.quaternion.slerp(this.rig._initialPoses.quaternions[this.c.object.name], this.alpha[2]||0);
  }
  
  _solution(rotateAngle) {
    var out = this.output;
    var _start = { rotation: out.a }, _end = { rotation: out.b }, _mid = { rotation: out.c };
    
    _start.rotation.x = rotateAngle * THREE.Math.DEG2RAD * 1.5;
    _start.rotation.x += this.s || 0;
    _start.rotation.y = _start.rotation.z = 0;
    _mid.rotation.y = _mid.rotation.z = 0;
    _mid.rotation.x = -_start.rotation.x * 1.5;//-2*rotateAngle * THREE.Math.DEG2RAD;
    _mid.rotation.x += this.t || 0;
    _end.rotation.y = _end.rotation.z = 0;
    _end.rotation.x = -Math.PI/2 - _mid.rotation.x/4;
    _end.rotation.x += this.u || 0;

    out.start.setFromEuler(_start.rotation);//new THREE.Euler(rotateAngle * THREE.Math.DEG2RAD * 1.5 + (this.s || 0), 0, 0));
    out.mid.setFromEuler(_mid.rotation);//new THREE.Euler(out.start.x * 1.5 + (this.t || 0), 0,0));
    out.end.setFromEuler(_end.rotation);//new THREE.Euler(-Math.PI/2 - this.b.rotation.x/4 + (this.u || 0), 0, 0));
    // return out;
    return out;
  }
};

export default ThreePointIK;

