import {Vector3, Quaternion, Transform, Helpers} from './Unity.js';

const zeroVector = new Vector3();
const forwardVector = new Vector3(0, 0, 1);
const leftRotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI/2);
const rightRotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -Math.PI/2);
const bankLeftRotation = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), Math.PI/2);
const bankRightRotation = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -Math.PI/2);
const z180Quaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI);

const localVector = new Vector3();
const localVector2 = new Vector3();
const localVector3 = new Vector3();
const localVector4 = new Vector3();
const localVector5 = new Vector3();
const localQuaternion = new Quaternion();
const localQuaternion2 = new Quaternion();
const localQuaternion3 = new Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();

	class VRArmIK
	{
		constructor(arm, shoulder, shoulderPoser, target, left) {
			this.arm = arm;
			this.shoulder = shoulder;
			this.shoulderPoser = shoulderPoser;
			this.target = target;
			this.left = left;

			this.upperArmLength = 0;
			this.lowerArmLength = 0;
			this.armLength = 0;
    }

		Start()
		{
			this.upperArmLength = Helpers.getWorldPosition(this.arm.lowerArm, localVector).distanceTo(Helpers.getWorldPosition(this.arm.upperArm, localVector2));
			this.lowerArmLength = Helpers.getWorldPosition(this.arm.hand, localVector).distanceTo(Helpers.getWorldPosition(this.arm.lowerArm, localVector2));
			this.armLength = this.upperArmLength + this.lowerArmLength;
		}

		Update()
		{
      this.arm.transform.matrixWorld.multiplyMatrices(this.arm.transform.parent.matrixWorld, this.arm.transform.matrix);
      this.arm.upperArm.matrixWorld.multiplyMatrices(this.arm.upperArm.parent.matrixWorld, this.arm.upperArm.matrix);

			const upperArmPosition = Helpers.getWorldPosition(this.arm.upperArm, localVector);
      const handPositionDistance = this.target.position.distanceTo(upperArmPosition);
      // let handPosition;
      // if (handPositionDistance < this.armLength) {
      	const handPosition = this.target.position;
      /* } else {
      	handPosition = this.arm.upperArm.position.add(
      		this.target.position.clone().sub(this.arm.upperArm.position).normalize().multiplyScalar(this.armLength)
      	);
      } */
      const handRotation = this.target.quaternion;

      const shoulderRotation = Helpers.getWorldQuaternion(this.shoulder.transform, localQuaternion);
      const shoulderRotationInverse = localQuaternion2.copy(shoulderRotation).inverse();

      const hypotenuseDistance = this.upperArmLength;
	    const directDistance = upperArmPosition.distanceTo(handPosition) / 2;
      const offsetDistance = hypotenuseDistance > directDistance ? Math.sqrt(hypotenuseDistance*hypotenuseDistance - directDistance*directDistance) : 0;
      // console.log('offset distance', this.upperArmLength, this.lowerArmLength, hypotenuseDistance, directDistance, offsetDistance);
      // const outFactor = targetEuler.x < 0 ? (1 - Math.min(Math.max(-targetEuler.x/(Math.PI/4), 0), 1)) : 1;
      const offsetDirection = localVector2.copy(handPosition).sub(upperArmPosition)
        .normalize()
        .cross(localVector3.set(-1, 0, 0).applyQuaternion(shoulderRotation));

      const targetEuler = localEuler.setFromQuaternion(
      	localQuaternion3
      	  .multiplyQuaternions(handRotation, shoulderRotationInverse)
      	  .premultiply(z180Quaternion),
      	'XYZ'
      );
      // const targetDirection = new Vector3(0, 0, 1).applyQuaternion(targetLocalRotation);
      if (this.left) {
    		const yFactor = Math.min(Math.max((targetEuler.y+Math.PI*0.1)/(Math.PI/2), 0), 1);
    		// const zFactor = Math.min(Math.max((-targetDirection.x + 0.5)/0.25, 0), 1)
    		// const xFactor = Math.min(Math.max((targetDirection.y-0.8)/0.2, 0), 1);
    		// yFactor *= 1-xFactor;
    		// const factor = Math.min(yFactor, 1-xFactor);//Math.min(yFactor, 1-xFactor);
    		targetEuler.z = Math.min(Math.max(targetEuler.z, -Math.PI/2), 0);
    		targetEuler.z = (targetEuler.z * (1 - yFactor)) + (-Math.PI/2 * yFactor);
    		// targetEuler.z *= 1 - xFactor;
    		// targetEuler.z *= 1 - zFactor;
      } else {
      	const yFactor = Math.min(Math.max((-targetEuler.y-Math.PI*0.1)/(Math.PI/2), 0), 1);
    		// const zFactor = Math.min(Math.max((-targetDirection.x + 0.5)/0.25, 0), 1)
    		// const xFactor = Math.min(Math.max((targetDirection.y-0.8)/0.2, 0), 1);
    		// yFactor *= 1-xFactor;
    		// const factor = Math.min(yFactor, 1-xFactor);//Math.min(yFactor, 1-xFactor);
    		targetEuler.z = Math.min(Math.max(targetEuler.z, 0), Math.PI/2);
    		targetEuler.z = (targetEuler.z * (1 - yFactor)) + (Math.PI/2 * yFactor);
    		// targetEuler.z *= 1 - xFactor;
    		// targetEuler.z *= 1 - zFactor;
      }
      offsetDirection
        .applyQuaternion(shoulderRotationInverse)
        .applyAxisAngle(forwardVector, targetEuler.z)
        .applyQuaternion(shoulderRotation);

      const elbowPosition = localVector3.copy(upperArmPosition).add(handPosition).divideScalar(2)
        .add(localVector4.copy(offsetDirection).multiplyScalar(offsetDistance));
      const upVector = localVector4.set(this.left ? -1 : 1, 0, 0).applyQuaternion(shoulderRotation);
      this.arm.upperArm.quaternion.setFromRotationMatrix(
      	localMatrix.lookAt(
	      	zeroVector,
	      	localVector5.copy(elbowPosition).sub(upperArmPosition),
	      	upVector
	      )
      )
        .multiply(this.left ? rightRotation : leftRotation)
        .premultiply(Helpers.getWorldQuaternion(this.arm.upperArm.parent, localQuaternion3).inverse());
      this.arm.upperArm.updateMatrix();
      this.arm.upperArm.matrixWorld.multiplyMatrices(this.arm.upperArm.parent.matrixWorld, this.arm.upperArm.matrix);

      // this.arm.lowerArm.position = elbowPosition;
      this.arm.lowerArm.quaternion.setFromRotationMatrix(
        localMatrix.lookAt(
	      	zeroVector,
	      	localVector5.copy(handPosition).sub(elbowPosition),
	      	upVector
	      )
      )
        .multiply(this.left ? rightRotation : leftRotation)
        .premultiply(Helpers.getWorldQuaternion(this.arm.lowerArm.parent, localQuaternion3).inverse());
      this.arm.lowerArm.updateMatrix();
      this.arm.lowerArm.matrixWorld.multiplyMatrices(this.arm.lowerArm.parent.matrixWorld, this.arm.lowerArm.matrix);

      // this.arm.hand.position = handPosition;
      this.arm.hand.quaternion.copy(this.target.quaternion)
        .multiply(this.left ? bankRightRotation : bankLeftRotation)
        .premultiply(Helpers.getWorldQuaternion(this.arm.hand.parent, localQuaternion3).inverse());
      this.arm.hand.updateMatrix();
      this.arm.hand.matrixWorld.multiplyMatrices(this.arm.hand.parent.matrixWorld, this.arm.hand.matrix);
		}
	}

export default VRArmIK;
