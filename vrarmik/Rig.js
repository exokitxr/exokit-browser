import {Vector3, Quaternion, GameObject} from './Unity.js';
import {fixSkeletonZForward} from '../proto/three-ik/modified.AxisUtils.js';
import PoseManager from './PoseManager.js';
import ShoulderTransforms from './ShoulderTransforms.js';
import LegsManager from './LegsManager.js';

const poses = {
  hmd: new THREE.Object3D(),
  leftGamepad: new THREE.Object3D(),
  rightGamepad: new THREE.Object3D(),
};

class Rig {
	constructor(model, {boneMappings}) {
    const modelBones = {
	    Hips: null,
	    Spine: null,
	    Chest: null,
	    Neck: null,
	    Head: null,
	    Eye_L: null,
	    Eye_R: null,

	    Left_shoulder: null,
	    Left_arm: null,
	    Left_elbow: null,
	    Left_wrist: null,
	    Left_leg: null,
	    Left_knee: null,
	    Left_ankle: null,

	    Right_shoulder: null,
	    Right_arm: null,
	    Right_elbow: null,
	    Right_wrist: null,
	    Right_leg: null,
	    Right_knee: null,
	    Right_ankle: null,
	  };
	  this.modelBones = modelBones;

	  model.updateMatrixWorld(true);
	  let skeleton;
	  model.traverse(o => {
	    if (o.isSkinnedMesh) {
	      if (!skeleton) {
	      	skeleton = o.skeleton;
	      }

	      o.bind(skeleton);
	    }
	  });
	  fixSkeletonZForward(skeleton.bones[0]);
	  model.traverse(o => {
	    if (o.isSkinnedMesh) {
	      o.bind(skeleton);
	    }
	  });
	  model.updateMatrixWorld(true);

	  model.traverse(o => {
	    if (o.isMesh) {
	      o.frustumCulled = false;
	    }
	    if (o.isSkinnedMesh) {
	      for (const k in modelBones) {
	        if (!modelBones[k]) {
	        	const userlandBoneName = boneMappings[k];
	          modelBones[k] = skeleton.bones.find(bone => bone.name === userlandBoneName);
	          modelBones[k].initialQuaternion = modelBones[k].quaternion.clone();
	          console.log('found bone', k, userlandBoneName, modelBones[k], modelBones[k].children);
	        }
	      }
	    }
	  });

	  const _getOffset = (bone, parent = bone.parent) => bone.getWorldPosition(new Vector3()).sub(parent.getWorldPosition(new Vector3()));
	  const _averagePoint = points => {
      const result = new Vector3();
      for (let i = 0; i < points.length; i++) {
        result.add(points[i]);
      }
      result.divideScalar(points.length);
      return result;
	  };
	  const setups = {
	    spine: _getOffset(modelBones.Spine),
	    hips: _getOffset(modelBones.Spine, modelBones.Head),
	    neck: _getOffset(modelBones.Neck),
	    head: _getOffset(modelBones.Head),
	    eyes: _averagePoint([_getOffset(modelBones.Eye_L), _getOffset(modelBones.Eye_R)]),

	    leftShoulder: _getOffset(modelBones.Right_shoulder),
	    leftUpperArm: _getOffset(modelBones.Right_arm),
	    leftLowerArm: _getOffset(modelBones.Right_elbow),
	    leftHand: _getOffset(modelBones.Right_wrist),

	    rightShoulder: _getOffset(modelBones.Left_shoulder),
	    rightUpperArm: _getOffset(modelBones.Left_arm),
	    rightLowerArm: _getOffset(modelBones.Left_elbow),
	    rightHand: _getOffset(modelBones.Left_wrist),

	    leftUpperLeg: _getOffset(modelBones.Right_leg),
	    leftLowerLeg: _getOffset(modelBones.Right_knee),
	    leftFoot: _getOffset(modelBones.Right_ankle),

	    rightUpperLeg: _getOffset(modelBones.Left_leg),
	    rightLowerLeg: _getOffset(modelBones.Left_knee),
	    rightFoot: _getOffset(modelBones.Left_ankle),
	  };

		const rigObject = new GameObject('rig');
		this.poseManager = rigObject.AddComponent(PoseManager);
		this.shoulderTransforms = rigObject.AddComponent(ShoulderTransforms);
		this.legsManager = rigObject.AddComponent(LegsManager);

    this.shoulderTransforms.spine.localPosition = setups.spine;
    this.shoulderTransforms.localPosition = setups.hips;
    this.shoulderTransforms.neck.localPosition = setups.neck;
    this.shoulderTransforms.head.localPosition = setups.head;
    this.shoulderTransforms.eyes.localPosition = setups.eyes;

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
			eyes: this.shoulderTransforms.eyes,
      head: this.shoulderTransforms.head,
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
		this.modelBoneOutputs = {
	    Hips: this.outputs.hips,
	    Spine: this.outputs.spine,
	    Chest: this.outputs.chest,
	    Neck: this.outputs.neck,
	    Head: this.outputs.head,

	    Left_shoulder: this.outputs.rightShoulder,
	    Left_arm: this.outputs.rightUpperArm,
	    Left_elbow: this.outputs.rightLowerArm,
	    Left_wrist: this.outputs.rightHand,
	    Left_leg: this.outputs.rightUpperLeg,
	    Left_knee: this.outputs.rightLowerLeg,
	    Left_ankle: this.outputs.rightFoot,

	    Right_shoulder: this.outputs.leftShoulder,
	    Right_arm: this.outputs.leftUpperArm,
	    Right_elbow: this.outputs.leftLowerArm,
	    Right_wrist: this.outputs.leftHand,
	    Right_leg: this.outputs.leftUpperLeg,
	    Right_knee: this.outputs.leftLowerLeg,
	    Right_ankle: this.outputs.leftFoot,
	  };

	  GameObject.startAll();
	}
	update() {
	  GameObject.updateAll();

	  for (const k in this.modelBones) {
      const modelBone = this.modelBones[k];
      const modelBoneOutput = this.modelBoneOutputs[k];

      if (k === 'Hips') {
        modelBone.position.copy(modelBoneOutput.position);
      }
      modelBone.quaternion
        .copy(modelBone.initialQuaternion)

      if (['Hips', 'Spine', 'Chest', 'Neck', 'Head'].includes(k)) {
        modelBone.quaternion
          .multiply(modelBoneOutput.localRotation)
      }

      if (['Left_leg'].includes(k)) {
        modelBone.quaternion
          .multiply(modelBoneOutput.localRotation)
          // .multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI/2))
      }
      if (['Left_knee'].includes(k)) {
        modelBone.quaternion
          .multiply(modelBoneOutput.localRotation)
          // .premultiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI))
      }
      if (['Left_ankle'].includes(k)) {
        modelBone.quaternion
          .premultiply(modelBoneOutput.localRotation)
          .multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI/2))
      }

      if (['Right_leg'].includes(k)) {
        modelBone.quaternion
          .multiply(modelBoneOutput.localRotation)
          // .multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI/2))
      }
      if (['Right_knee'].includes(k)) {
        modelBone.quaternion
          .multiply(modelBoneOutput.localRotation)
          // .premultiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI))
      }
      if (['Right_ankle'].includes(k)) {
        modelBone.quaternion
          .premultiply(modelBoneOutput.localRotation)
          .multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI/2))
      }

      if (['Left_shoulder'].includes(k)) {
        modelBone.quaternion
          .multiply(modelBoneOutput.localRotation)
      }
      if (['Left_arm'].includes(k)) {
        modelBone.quaternion
          .premultiply(modelBoneOutput.localRotation)
          // .multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -Math.PI/2)) // forward
          // .multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI*0.6))
          // .multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), Math.PI/4)) // up
          // .multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), Math.PI/4)) // down
      }
      if (['Left_elbow'].includes(k)) {
        modelBone.quaternion
          .premultiply(modelBoneOutput.localRotation)
      }
      if (['Left_wrist'].includes(k)) {
        modelBone.quaternion
          .premultiply(modelBoneOutput.localRotation)
          .multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -Math.PI/2)) // center
          .multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), Math.PI/4)) // ip
      }

      if (['Right_shoulder'].includes(k)) {
        modelBone.quaternion
          .multiply(modelBoneOutput.localRotation)
      }
      if (['Right_arm'].includes(k)) {
        modelBone.quaternion
          .premultiply(modelBoneOutput.localRotation)
          // .multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -Math.PI/2)) // forward
          // .multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI*0.6))
          // .multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), Math.PI/4)) // up
          // .multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), Math.PI/4)) // down
      }
      if (['Right_elbow'].includes(k)) {
        modelBone.quaternion
          .premultiply(modelBoneOutput.localRotation)
      }
      if (['Right_wrist'].includes(k)) {
        modelBone.quaternion
          .premultiply(modelBoneOutput.localRotation)
          .multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI/2)) // center
          .multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -Math.PI/8)) // up
      }
      modelBone.updateMatrixWorld();
    }
	}
}
export default Rig;