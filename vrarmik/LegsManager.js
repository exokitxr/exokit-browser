import {Vector2, Vector3, Quaternion, Transform} from './Unity.js';

const zeroVector = new Vector3();
const oneVector = new Vector3(1, 1, 1);
const identityRotation = new Quaternion();
const downHalfRotation = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI/2);
const upHalfRotation = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI/2);
const downQuarterRotation = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI/4);

const localVector = new Vector3();
const localVector2 = new Vector3();
const localQuaternion = new Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
const localMatrix3 = new THREE.Matrix4();

const _mod = (a, n) => (a % n + n) % n;
const _angleDiff = (targetA, sourceA) => {
  let a = targetA - sourceA;
  a = _mod((a + Math.PI), Math.PI*2) - Math.PI;
  return a;
};

class Leg {
  constructor(left) {
  	this.transform = new Transform();
    this.upperLeg = new Transform();
    this.lowerLeg = new Transform();
    this.foot = new Transform();
    this.foot.stickTransform = new THREE.Object3D();

    this.transform.AddChild(this.upperLeg);
    this.upperLeg.AddChild(this.lowerLeg);
    this.lowerLeg.AddChild(this.foot);

    this.upperLegLength = 0;
    this.lowerLegLength = 0;
    this.legLength = 0;

    this.left = left;
    this.standing = true;

    this.poseManager = null;
  }

  Start() {
  	// this.foot.stickTransform.position.copy(this.foot.position);
    this.upperLegLength = this.lowerLeg.localPosition.length();
    this.lowerLegLength = this.foot.localPosition.length();
    this.legLength = this.upperLegLength + this.lowerLegLength;
  }

  Update() {
    const footPosition = this.foot.stickTransform.position;
    const g = this.upperLeg.position.add(localVector.copy(footPosition).sub(this.upperLeg.position).normalize().multiplyScalar(this.legLength));
    if (g.y <= 0) {
      footPosition.y = 0;
      const footRotation = this.foot.stickTransform.quaternion;

	    const hypotenuseDistance = this.upperLegLength;
	    const verticalDistance = Math.abs(this.upperLeg.position.y) / 2;
      const offsetDistance = hypotenuseDistance > verticalDistance ? Math.sqrt(hypotenuseDistance*hypotenuseDistance - verticalDistance*verticalDistance) : 0;
      const offsetDirection = localVector.copy(footPosition).sub(this.upperLeg.position)
        .cross(localVector2.set(1, 0, 0).applyQuaternion(footRotation))
        .normalize();

      const lowerLegPosition = this.upperLeg.position.add(footPosition).divideScalar(2)
        .add(localVector2.copy(offsetDirection).multiplyScalar(offsetDistance));

      const upperLegDiff = this.upperLeg.position.sub(lowerLegPosition);
      const upperLegRotation = localQuaternion.setFromRotationMatrix(
	      localMatrix.lookAt(
	        zeroVector,
	        upperLegDiff,
	        localVector2.set(0, 0, 1).applyQuaternion(footRotation)
	      )
	    ).multiply(downHalfRotation);
      this.upperLeg.rotation = upperLegRotation;

		  const lowerLegDiff = lowerLegPosition.clone().sub(footPosition);
      const lowerLegRotation = localQuaternion.setFromRotationMatrix(
	      localMatrix.lookAt(
	        zeroVector,
	        lowerLegDiff,
	        localVector2.set(0, 0, 1).applyQuaternion(footRotation)
	      )
	    ).multiply(downHalfRotation);
	    this.lowerLeg.rotation = lowerLegRotation;

      // this.lowerLeg.position = lowerLegPosition;

      // this.foot.position = footPosition;
      this.foot.rotation = localQuaternion.copy(footRotation).multiply(downHalfRotation);
      // this.foot.stickTransform.position = footPosition;

      this.standing = true;
    } else {
    	this.upperLeg.localRotation = this.upperLeg.localRotation.slerp(identityRotation, 0.1);
    	this.lowerLeg.localRotation = this.lowerLeg.localRotation.slerp(identityRotation, 0.1);
    	this.foot.localRotation = this.foot.localRotation.slerp(downQuarterRotation, 0.1);

      this.standing = false;
    }
	}
}

class LegsManager {
	constructor(rig) {
    this.hips = rig.shoulderTransforms.hips;
    this.leftLeg = new Leg(true);
    this.hips.AddChild(this.leftLeg.transform);
    this.rightLeg = new Leg(false);
    this.hips.AddChild(this.rightLeg.transform);

    this.poseManager = rig.poseManager;
    this.leftLeg.poseManager = this.poseManager;
    this.rightLeg.poseManager = this.poseManager;
  }

  Start() {
  	this.legSeparation = this.leftLeg.upperLeg.position.distanceTo(this.rightLeg.upperLeg.position);
  	this.leftLeg.Start();
  	this.rightLeg.Start();
  }

	Update() {
    const hipsFloorPosition = this.hips.position;
    hipsFloorPosition.y = 0;
    const hipsFloorEuler = localEuler.setFromQuaternion(this.hips.rotation, 'YXZ');
    hipsFloorEuler.x = 0;
    hipsFloorEuler.z = 0;
    const planeMatrix = localMatrix.compose(hipsFloorPosition, localQuaternion.setFromEuler(hipsFloorEuler), oneVector);
    const planeMatrixInverse = localMatrix2.getInverse(planeMatrix);

    const position = new Vector3();
    const quaternion = new Quaternion();
    const scale = new Vector3();
    localMatrix3.compose(this.leftLeg.foot.stickTransform.position, this.leftLeg.foot.stickTransform.quaternion, oneVector)
      .premultiply(planeMatrixInverse)
      .decompose(position, quaternion, scale);
    const leftFootPosition = position.clone();
    const leftFootRotation = quaternion.clone();

    localMatrix3.compose(this.rightLeg.foot.stickTransform.position, this.rightLeg.foot.stickTransform.quaternion, oneVector)
      .premultiply(planeMatrixInverse)
      .decompose(position, quaternion, scale);
    const rightFootPosition = position.clone();
    const rightFootRotation = quaternion.clone();

    // rotation

    if (this.leftLeg.standing) {
      const leftFootEuler = localEuler.setFromQuaternion(leftFootRotation, 'YXZ');
      leftFootEuler.x = 0;
	    leftFootEuler.z = 0;
    	if (leftFootEuler.y < -Math.PI*0.15) {
    		leftFootEuler.y = -Math.PI*0.15;
    	}
    	if (leftFootEuler.y > Math.PI*0.15) {
    		leftFootEuler.y = Math.PI*0.15;
    	}
    	localMatrix3.compose(zeroVector, localQuaternion.setFromEuler(leftFootEuler), oneVector)
	      .premultiply(planeMatrix)
	      .decompose(position, this.leftLeg.foot.stickTransform.quaternion, scale);
    } else {
    	this.leftLeg.foot.stickTransform.quaternion.copy(this.leftLeg.foot.rotation).multiply(upHalfRotation);
    }
    if (this.rightLeg.standing) {
	    const rightFootEuler = localEuler.setFromQuaternion(rightFootRotation, 'YXZ');
	    rightFootEuler.x = 0;
	    rightFootEuler.z = 0;
    	if (rightFootEuler.y < -Math.PI*0.15) {
    		rightFootEuler.y = -Math.PI*0.15;
    	}
    	if (rightFootEuler.y > Math.PI*0.15) {
    		rightFootEuler.y = Math.PI*0.15;
    	}
    	localMatrix3.compose(zeroVector, localQuaternion.setFromEuler(rightFootEuler), oneVector)
	      .premultiply(planeMatrix)
	      .decompose(position, this.rightLeg.foot.stickTransform.quaternion, scale);
	  } else {
      this.rightLeg.foot.stickTransform.quaternion.copy(this.rightLeg.foot.rotation).multiply(upHalfRotation);
	  }

	  // position

    if (this.leftLeg.standing) {
    	let leftFootDistance = Math.sqrt(leftFootPosition.x*leftFootPosition.x + leftFootPosition.z*leftFootPosition.z);
			const leftFootAngle = Math.atan2(leftFootPosition.clone().normalize().z, leftFootPosition.clone().normalize().x);
			const leftAngleDiff = _angleDiff(Math.PI/2, leftFootAngle);
			if (leftFootDistance < this.legSeparation*0.7 || leftFootDistance > this.legSeparation*3 || leftAngleDiff > -Math.PI*0.3 || leftAngleDiff < -Math.PI/2-Math.PI*0.3) {
				leftFootDistance = Math.min(Math.max(leftFootDistance, this.legSeparation*0.7), this.legSeparation*1.4);
				this.leftLeg.foot.stickTransform.position.copy(hipsFloorPosition).add(new Vector3(-leftFootDistance, 0, 0).applyQuaternion(this.leftLeg.foot.stickTransform.quaternion));
			}
		} else {
			this.leftLeg.foot.stickTransform.position.copy(this.leftLeg.foot.position);
			this.leftLeg.foot.stickTransform.position.y = 0;
		}
		if (this.rightLeg.standing) {
			let rightFootDistance = Math.sqrt(rightFootPosition.x*rightFootPosition.x + rightFootPosition.z*rightFootPosition.z);
			const rightFootAngle = Math.atan2(rightFootPosition.clone().normalize().z, rightFootPosition.clone().normalize().x);
			const rightAngleDiff = _angleDiff(Math.PI/2, rightFootAngle);
	    if (rightFootDistance < this.legSeparation*0.7 || rightFootDistance > this.legSeparation*3 || rightAngleDiff < Math.PI*0.3 || rightAngleDiff > Math.PI/2+Math.PI*0.3) {
				rightFootDistance = Math.min(Math.max(rightFootDistance, this.legSeparation*0.7), this.legSeparation*1.4);
			  this.rightLeg.foot.stickTransform.position.copy(hipsFloorPosition).add(new Vector3(rightFootDistance, 0, 0).applyQuaternion(this.rightLeg.foot.stickTransform.quaternion));
			}
		} else {
			this.rightLeg.foot.stickTransform.position.copy(this.rightLeg.foot.position);
			this.rightLeg.foot.stickTransform.position.y = 0;
		}

		this.leftLeg.Update();
		this.rightLeg.Update();
  }
}

export default LegsManager;
