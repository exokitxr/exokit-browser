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
	constructor(setups) {
		const rig = new GameObject('rig');
		this.poseManager = rig.AddComponent(PoseManager);
		this.shoulderTransforms = rig.AddComponent(ShoulderTransforms);
		this.legsManager = rig.AddComponent(LegsManager);

    this.shoulderTransforms.spine.localPosition = setups.spine;
    this.shoulderTransforms.localPosition = setups.hips;
    this.shoulderTransforms.neck.localPosition = setups.neck;
    this.shoulderTransforms.head.localPosition = setups.head;

    this.shoulderTransforms.leftShoulderAnchor.localPosition = setups.leftShoulder;
    this.shoulderTransforms.leftArm.upperArm.localPosition = setups.leftUpperArm;
    this.shoulderTransforms.leftArm.lowerArm.localPosition = setups.leftLowerArm;
    this.shoulderTransforms.leftArm.hand.localPosition = setups.leftHand;

    this.shoulderTransforms.rightShoulderAnchor.localPosition = setups.rightShoulder;
    this.shoulderTransforms.rightArm.upperArm.localPosition = setups.rightUpperArm;
    this.shoulderTransforms.rightArm.lowerArm.localPosition = setups.rightLowerArm;
    this.shoulderTransforms.rightArm.hand.localPosition = setups.rightHand;

    this.legsManager.leftLeg.upperLeg.localPosition = setups.leftUpperLeg;
    this.legsManager.leftLeg.lowerLeg.localPosition = setups.leftLowerLeg;
    this.legsManager.leftLeg.foot.localPosition = setups.leftFoot;

    this.legsManager.rightLeg.upperLeg.localPosition = setups.rightUpperLeg;
    this.legsManager.rightLeg.lowerLeg.localPosition = setups.rightLowerLeg;
    this.legsManager.rightLeg.foot.localPosition = setups.rightFoot;

		this.inputs = {
      hmd: this.poseManager.vrTransforms.head,
			leftGamepad: this.poseManager.vrTransforms.leftHand,
			rightGamepad: this.poseManager.vrTransforms.rightHand,
		};
		this.outputs = {
      hmd: this.shoulderTransforms.head,
      hips: this.legsManager.hips,
      spine: this.shoulderTransforms.spine,
      chest: this.shoulderTransforms.transform,
      neck: this.shoulderTransforms.neck,
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

	  GameObject.startAll();
	}
	update() {
	  GameObject.updateAll();
	}
}
export default Rig;