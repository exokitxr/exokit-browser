import {Vector3, Quaternion, GameObject} from './Unity.js';
import PoseManager from './PoseManager.js';
import ShoulderTransforms from './ShoulderTransforms.js';
import LegsManager from './LegsManager.js';

const poses = {
  hmd: new THREE.Object3D(),
  leftGamepad: new THREE.Object3D(),
  rightGamepad: new THREE.Object3D(),
};

class Rig {
	constructor() {
		const rig = new GameObject('rig');
		this.poseManager = rig.AddComponent(PoseManager);
		this.shoulderTransforms = rig.AddComponent(ShoulderTransforms);
		this.legsManager = rig.AddComponent(LegsManager);

		GameObject.startAll();

		this.inputs = {
      hmd: this.poseManager.vrTransforms.head,
			leftGamepad: this.poseManager.vrTransforms.leftHand,
			rightGamepad: this.poseManager.vrTransforms.rightHand,
			leftFoot: this.legsManager.leftLeg.foot,
			rightFoot: this.legsManager.rightLeg.foot,
		};
		this.outputs = {
      hmd: this.poseManager.vrTransforms.head,
      hips: this.legsManager.hips,
      spine: this.shoulderTransforms.spine,
      chest: this.shoulderTransforms.transform,
      leftShoulder: this.shoulderTransforms.leftShoulderAnchor,
      leftUpperArm: this.shoulderTransforms.leftArm.upperArm,
      leftLowerArm: this.shoulderTransforms.leftArm.lowerArm,
      leftHand: this.shoulderTransforms.leftArm.hand,
      rightShoulder: this.shoulderTransforms.rightShoulderAnchor,
      rightUpperArm: this.shoulderTransforms.rightArm.upperArm,
      rightLowerArm: this.shoulderTransforms.rightArm.lowerArm,
      rightHand: this.shoulderTransforms.rightArm.hand,
      leftUpperLeg: this.legsManager.leftLeg.upperLeg,
      leftLowerLeg: this.legsManager.leftLeg.lowerLeg,
      leftFoot: this.legsManager.leftLeg.foot,
      rightUpperLeg: this.legsManager.rightLeg.upperLeg,
      rightLowerLeg: this.legsManager.rightLeg.lowerLeg,
      rightFoot: this.legsManager.rightLeg.foot,
		};
	}
	update() {
	  GameObject.updateAll();
	}
}
export default Rig;