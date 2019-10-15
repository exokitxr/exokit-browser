import {Vector3, Quaternion, GameObject} from './Unity.js';
import PoseManager from './PoseManager.js';
import ShoulderTransforms from './ShoulderTransforms.js';

const poses = {
  hmd: new THREE.Object3D(),
  leftGamepad: new THREE.Object3D(),
  rightGamepad: new THREE.Object3D(),
};

class Rig {
	constructor() {
    const root = new GameObject('root');
		const rig = new GameObject('rig');
		root.AddChild(rig);
		this.poseManager = rig.AddComponent(PoseManager);
		this.shoulderTransforms = rig.AddComponent(ShoulderTransforms);

		GameObject.startAll();

		this.inputs = {
      hmd: new THREE.Object3D(),
			leftGamepad: new THREE.Object3D(),
			rightGamepad: new THREE.Object3D(),
		};
		this.outputs = {
      hmd: this.poseManager.vrTransforms.hmd,
      chest: this.shoulderTransforms.transform,
      leftShoulder: this.shoulderTransforms.leftShoulderAnchor,
      leftUpperArm: this.shoulderTransforms.leftArm.upperArm,
      leftLowerArm: this.shoulderTransforms.leftArm.lowerArm,
      leftHand: this.shoulderTransforms.leftArm.hand,
      rightShoulder: this.shoulderTransforms.rightShoulderAnchor,
      rightUpperArm: this.shoulderTransforms.rightArm.upperArm,
      rightLowerArm: this.shoulderTransforms.rightArm.lowerArm,
      rightHand: this.shoulderTransforms.rightArm.hand,
		};
	}
	update() {
	  this.poseManager.vrTransforms.hmd.position = this.inputs.hmd.position;
	  this.poseManager.vrTransforms.hmd.rotation = this.inputs.hmd.quaternion;
	  this.poseManager.vrTransforms.leftController.position = this.inputs.leftGamepad.position;
	  this.poseManager.vrTransforms.leftController.rotation = this.inputs.leftGamepad.quaternion;
	  this.poseManager.vrTransforms.rightController.position = this.inputs.rightGamepad.position;
	  this.poseManager.vrTransforms.rightController.rotation = this.inputs.rightGamepad.quaternion;

	  this.poseManager.vrTransforms.head.position = this.inputs.hmd.position;
	  this.poseManager.vrTransforms.head.rotation = this.inputs.hmd.quaternion;
	  this.poseManager.vrTransforms.leftHand.position = this.inputs.leftGamepad.position;
	  this.poseManager.vrTransforms.leftHand.rotation = this.inputs.leftGamepad.quaternion;
	  this.poseManager.vrTransforms.rightHand.position = this.inputs.rightGamepad.position;
	  this.poseManager.vrTransforms.rightHand.rotation = this.inputs.rightGamepad.quaternion;

	  GameObject.updateAll();
	}
}
export default Rig;