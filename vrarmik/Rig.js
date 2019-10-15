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
      hmd: this.poseManager.vrTransforms.head,
			leftGamepad: this.poseManager.vrTransforms.leftHand,
			rightGamepad: this.poseManager.vrTransforms.rightHand,
		};
		this.outputs = {
      hmd: this.poseManager.vrTransforms.head,
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
	  GameObject.updateAll();
	}
}
export default Rig;