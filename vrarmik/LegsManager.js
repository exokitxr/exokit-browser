import {Vector2, Vector3, Quaternion, Transform, Helpers} from './Unity.js';

const zeroVector = new Vector3();
const oneVector = new Vector3(1, 1, 1);
const identityRotation = new Quaternion();
const downHalfRotation = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI/2);
const upHalfRotation = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI/2);
const downQuarterRotation = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI/4);

const localVector = new Vector3();
const localVector2 = new Vector3();
const localVector3 = new Vector3();
const localVector4 = new Vector3();
const localVector5 = new Vector3();
const localVector6 = new Vector3();
const localQuaternion = new Quaternion();
const localQuaternion2 = new Quaternion();
const localQuaternion3 = new Quaternion();
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
  	this.transform = new THREE.Object3D();
    this.upperLeg = new THREE.Object3D();
    this.lowerLeg = new THREE.Object3D();
    this.foot = new THREE.Object3D();
    this.foot.stickTransform = new THREE.Object3D();

    this.transform.add(this.upperLeg);
    this.upperLeg.add(this.lowerLeg);
    this.lowerLeg.add(this.foot);

    this.upperLegLength = 0;
    this.lowerLegLength = 0;
    this.legLength = 0;

    this.left = left;
    this.standing = true;

    this.poseManager = null;
  }

  Start() {
  	// this.foot.stickTransform.position.copy(this.foot.position);
    this.upperLegLength = this.lowerLeg.position.length();
    this.lowerLegLength = this.foot.position.length();
    this.legLength = this.upperLegLength + this.lowerLegLength;
  }

  Update() {
    const footPosition = localVector.copy(this.foot.stickTransform.position);
    const upperLegPosition = Helpers.getWorldPosition(this.upperLeg, localVector2);
    const extendedLegPosition = localVector3.copy(upperLegPosition)
      .add(
      	localVector4.copy(footPosition).sub(upperLegPosition).normalize().multiplyScalar(this.legLength)
      );

    if (extendedLegPosition.y <= 0) {
      footPosition.y = 0;

      const footRotation = this.foot.stickTransform.quaternion;

	    const hypotenuseDistance = this.upperLegLength;
	    const verticalDistance = Math.abs(upperLegPosition.y) / 2;
      const offsetDistance = hypotenuseDistance > verticalDistance ? Math.sqrt(hypotenuseDistance*hypotenuseDistance - verticalDistance*verticalDistance) : 0;

      const lowerLegPosition = localVector4.copy(upperLegPosition).add(footPosition).divideScalar(2)
        .add(
        	localVector5.copy(footPosition).sub(upperLegPosition)
		        .cross(localVector6.set(1, 0, 0).applyQuaternion(footRotation))
		        .normalize()
        		.multiplyScalar(offsetDistance)
        );

      this.upperLeg.quaternion.setFromRotationMatrix(
	      localMatrix.lookAt(
	        zeroVector,
	        localVector5.copy(upperLegPosition).sub(lowerLegPosition),
	        localVector6.set(0, 0, 1).applyQuaternion(footRotation)
	      )
	    )
	      .multiply(downHalfRotation)
	      .premultiply(Helpers.getWorldQuaternion(this.transform, localQuaternion).inverse());
	    this.upperLeg.updateMatrix();
	    this.upperLeg.matrixWorld.multiplyMatrices(this.upperLeg.parent.matrixWorld, this.upperLeg.matrix);

	    this.lowerLeg.quaternion.setFromRotationMatrix(
	      localMatrix.lookAt(
	        zeroVector,
	        localVector5.copy(lowerLegPosition).sub(footPosition),
	        localVector6.set(0, 0, 1).applyQuaternion(footRotation)
	      )
	    )
	      .multiply(downHalfRotation)
	      .premultiply(Helpers.getWorldQuaternion(this.upperLeg, localQuaternion).inverse());
	    this.lowerLeg.updateMatrix();
	    this.lowerLeg.matrixWorld.multiplyMatrices(this.lowerLeg.parent.matrixWorld, this.lowerLeg.matrix);

      // this.lowerLeg.position = lowerLegPosition;

      // this.foot.position = footPosition;
      this.foot.quaternion.copy(footRotation)
        .multiply(downHalfRotation)
        .premultiply(Helpers.getWorldQuaternion(this.lowerLeg, localQuaternion).inverse());
      this.foot.updateMatrix();
      this.foot.matrixWorld.multiplyMatrices(this.foot.parent.matrixWorld, this.foot.matrix);
      // this.foot.stickTransform.position = footPosition;

      this.standing = true;
    } else {
    	this.upperLeg.quaternion.slerp(identityRotation, 0.1);
    	this.lowerLeg.quaternion.slerp(identityRotation, 0.1);
    	this.foot.quaternion.slerp(downQuarterRotation, 0.1);
    	this.transform.updateMatrixWorld(true);

      this.standing = false;
    }
	}
}

class LegsManager {
	constructor(rig) {
    this.hips = rig.shoulderTransforms.hips;
    this.leftLeg = new Leg(true);
    this.hips.add(this.leftLeg.transform);
    this.rightLeg = new Leg(false);
    this.hips.add(this.rightLeg.transform);

    this.poseManager = rig.poseManager;
    this.leftLeg.poseManager = this.poseManager;
    this.rightLeg.poseManager = this.poseManager;
  }

  Start() {
  	this.legSeparation = Helpers.getWorldPosition(this.leftLeg.upperLeg, localVector)
  	  .distanceTo(Helpers.getWorldPosition(this.rightLeg.upperLeg, localVector2));
  	this.leftLeg.Start();
  	this.rightLeg.Start();
  }

	Update() {
		this.leftLeg.transform.matrixWorld.multiplyMatrices(this.leftLeg.transform.parent.matrixWorld, this.leftLeg.transform.matrix);
    this.leftLeg.upperLeg.matrixWorld.multiplyMatrices(this.leftLeg.upperLeg.parent.matrixWorld, this.leftLeg.upperLeg.matrix);
    this.leftLeg.lowerLeg.matrixWorld.multiplyMatrices(this.leftLeg.lowerLeg.parent.matrixWorld, this.leftLeg.lowerLeg.matrix);
    this.leftLeg.foot.matrixWorld.multiplyMatrices(this.leftLeg.foot.parent.matrixWorld, this.leftLeg.foot.matrix);

    this.rightLeg.transform.matrixWorld.multiplyMatrices(this.rightLeg.transform.parent.matrixWorld, this.rightLeg.transform.matrix);
    this.rightLeg.upperLeg.matrixWorld.multiplyMatrices(this.rightLeg.upperLeg.parent.matrixWorld, this.rightLeg.upperLeg.matrix);
    this.rightLeg.lowerLeg.matrixWorld.multiplyMatrices(this.rightLeg.lowerLeg.parent.matrixWorld, this.rightLeg.lowerLeg.matrix);
    this.rightLeg.foot.matrixWorld.multiplyMatrices(this.rightLeg.foot.parent.matrixWorld, this.rightLeg.foot.matrix);

    const hipsFloorPosition = localVector.copy(this.hips.position);
    hipsFloorPosition.y = 0;
    const hipsFloorEuler = localEuler.setFromQuaternion(this.hips.quaternion, 'YXZ');
    hipsFloorEuler.x = 0;
    hipsFloorEuler.z = 0;
    const planeMatrix = localMatrix.compose(hipsFloorPosition, localQuaternion.setFromEuler(hipsFloorEuler), oneVector);
    const planeMatrixInverse = localMatrix2.getInverse(planeMatrix);

    const fakePosition = localVector2;
    const fakeScale = localVector3;

    const leftFootPosition = localVector4;
    const leftFootRotation = localQuaternion;
    localMatrix3.compose(this.leftLeg.foot.stickTransform.position, this.leftLeg.foot.stickTransform.quaternion, oneVector)
      .premultiply(planeMatrixInverse)
      .decompose(leftFootPosition, leftFootRotation, fakeScale);

    const rightFootPosition = localVector5;
    const rightFootRotation = localQuaternion2;
    localMatrix3.compose(this.rightLeg.foot.stickTransform.position, this.rightLeg.foot.stickTransform.quaternion, oneVector)
      .premultiply(planeMatrixInverse)
      .decompose(rightFootPosition, rightFootRotation, fakeScale);

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
    	localMatrix3.compose(zeroVector, localQuaternion3.setFromEuler(leftFootEuler), oneVector)
	      .premultiply(planeMatrix)
	      .decompose(fakePosition, this.leftLeg.foot.stickTransform.quaternion, fakeScale);
    } else {
    	Helpers.getWorldQuaternion(this.leftLeg.foot, this.leftLeg.foot.stickTransform.quaternion)
    	  .multiply(upHalfRotation);
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
    	localMatrix3.compose(zeroVector, localQuaternion3.setFromEuler(rightFootEuler), oneVector)
	      .premultiply(planeMatrix)
	      .decompose(fakePosition, this.rightLeg.foot.stickTransform.quaternion, fakeScale);
	  } else {
      Helpers.getWorldQuaternion(this.rightLeg.foot, this.rightLeg.foot.stickTransform.quaternion)
        .multiply(upHalfRotation);
	  }

	  // position

    if (this.leftLeg.standing) {
    	let leftFootDistance = Math.sqrt(leftFootPosition.x*leftFootPosition.x + leftFootPosition.z*leftFootPosition.z);
			const leftFootAngle = Math.atan2(leftFootPosition.z, leftFootPosition.x);
			const leftAngleDiff = _angleDiff(Math.PI/2, leftFootAngle);
			if (leftFootDistance < this.legSeparation*0.7 || leftFootDistance > this.legSeparation*3 || leftAngleDiff > -Math.PI*0.3 || leftAngleDiff < -Math.PI/2-Math.PI*0.3) {
				leftFootDistance = Math.min(Math.max(leftFootDistance, this.legSeparation*0.7), this.legSeparation*1.4);
				this.leftLeg.foot.stickTransform.position.copy(hipsFloorPosition)
				  .add(localVector6.set(-leftFootDistance, 0, 0).applyQuaternion(this.leftLeg.foot.stickTransform.quaternion));
			}
		} else {
			Helpers.getWorldPosition(this.leftLeg.foot, this.leftLeg.foot.stickTransform.position);
			this.leftLeg.foot.stickTransform.position.y = 0;
		}
		if (this.rightLeg.standing) {
			let rightFootDistance = Math.sqrt(rightFootPosition.x*rightFootPosition.x + rightFootPosition.z*rightFootPosition.z);
			const rightFootAngle = Math.atan2(rightFootPosition.z, rightFootPosition.x);
			const rightAngleDiff = _angleDiff(Math.PI/2, rightFootAngle);
	    if (rightFootDistance < this.legSeparation*0.7 || rightFootDistance > this.legSeparation*3 || rightAngleDiff < Math.PI*0.3 || rightAngleDiff > Math.PI/2+Math.PI*0.3) {
				rightFootDistance = Math.min(Math.max(rightFootDistance, this.legSeparation*0.7), this.legSeparation*1.4);
			  this.rightLeg.foot.stickTransform.position.copy(hipsFloorPosition)
			    .add(localVector6.set(rightFootDistance, 0, 0).applyQuaternion(this.rightLeg.foot.stickTransform.quaternion));
			}
		} else {
			Helpers.getWorldPosition(this.rightLeg.foot, this.rightLeg.foot.stickTransform.position);
			this.rightLeg.foot.stickTransform.position.y = 0;
		}

		this.leftLeg.Update();
		this.rightLeg.Update();
  }
}

export default LegsManager;
