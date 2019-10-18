import {Vector2, Vector3, Quaternion, Transform, GameObject, MonoBehavior, XRSettings} from './Unity.js';
import PoseManager from './PoseManager.js';
import ShoulderTransforms from './ShoulderTransforms.js';

const _mod = (a, n) => (a % n + n) % n;
const _angleDiff = (targetA, sourceA) => {
  let a = targetA - sourceA;
  a = _mod((a + Math.PI), Math.PI*2) - Math.PI;
  return a;
};

class Leg extends MonoBehavior {
  constructor(...args) {
    super(...args);

    this.upperLeg = new Transform();
    this.lowerLeg = new Transform();
    this.foot = new Transform();
    this.foot.stickTransform = new Transform();

    this.transform.AddChild(this.upperLeg);
    this.upperLeg.AddChild(this.lowerLeg);
    this.lowerLeg.AddChild(this.foot);

    this.upperLegLength = 0;
    this.lowerLegLength = 0;

    this.left = true;
    this.standing = true;

    // this.hmdTransformRef = null
  }

  Start() {
    this.foot.stickTransform.position = this.foot.position;
    this.upperLegLength = this.lowerLeg.localPosition.length();
    this.lowerLegLength = this.foot.localPosition.length();
  }

  LateUpdate() {
  	// const hipsDirection = new Vector3(0, 0, 1).applyQuaternion(this.transform.rotation);
  	// const hipsY = Math.atan2(hipsDirection.z, hipsDirection.x);
  	/* if (hipsY > Math.PI) {
  		hipsY -= Math.PI;
  	}
  	if (hipsY < Math.PI) {
  		hipsY += Math.PI;
  	} */

  	/* const upperLegDirection = new Vector3(0, 0, 1).applyQuaternion(this.upperLeg.rotation);
  	const upperLegY = Math.atan2(upperLegDirection.z, upperLegDirection.x);
    const legDiff = this.foot.position.sub(this.transform.position);
		const footEuler = new THREE.Euler(0, upperLegY - Math.PI/2, 0, 'YXZ'); */

		/* const footEuler = new THREE.Euler().setFromQuaternion(this.foot.rotation.multiply(new Quaternion().setFromUnitVectors(new Vector3(0, -1, 0), new Vector3(0, 0, 1)).inverse()), 'YXZ');
    footEuler.x = 0;
    footEuler.z = 0; */

		/* let angleDiff = (() => {
			let a = hipsY;
			let b = upperLegY;
			let d = _angleDiff(a, b);
			return d;
		})();
		if (this.left) {
			angleDiff *= -1;
		}
		if (angleDiff < -Math.PI/3) {
			if (this.left) {
				// debugger;
				// console.log('correct 1', hipsY, upperLegY, angleDiff);
				// debugger;
				footEuler.y += Math.PI/3;
			} else {
				footEuler.y -= Math.PI/3;
			}
		} else if (angleDiff > Math.PI/8) {
			if (this.left) {
				// debugger;
				// console.log('correct 2', hipsY, upperLegY, angleDiff);
				// debugger;
				footEuler.y -= Math.PI/8;
			} else {
				footEuler.y += Math.PI/8;
			}
		} */

    const {upperLegLength, lowerLegLength} = this;
    // console.log('check', this.upperLeg.position.y, (upperLegLength + lowerLegLength), this.foot.stickTransform.position.y);
    if (/*this.upperLeg.position.y < (upperLegLength + lowerLegLength) && */this.foot.position.y <= 0.05) {
      const footPosition = this.foot.stickTransform.position;

      footPosition.y = 0;
      // const footRotation = this.upperLeg.rotation;
      const footRotation = this.foot.stickTransform.rotation;
      // const footRotation = new Quaternion().setFromEuler(footEuler);
      // const footRotation = this.foot.rotation;

	    const hypotenuseDistance = upperLegLength;
	    const verticalDistance = Math.abs(this.upperLeg.position.y) / 2;
      const offsetDistance = verticalDistance < hypotenuseDistance ? Math.sqrt(hypotenuseDistance*hypotenuseDistance - verticalDistance*verticalDistance) : 0;
      const offsetDirection = footPosition.clone().sub(this.upperLeg.position)
        .cross(new Vector3(1, 0, 0).applyQuaternion(footRotation))
        .normalize();

      const lowerLegPosition = this.upperLeg.position.add(footPosition).divideScalar(2)
        .add(offsetDirection.clone().multiplyScalar(offsetDistance));

      this.upperLeg.rotation = new Quaternion().setFromRotationMatrix(
	      new THREE.Matrix4().lookAt(
	        lowerLegPosition,
	        this.upperLeg.position,
	        new Vector3(0, 0, 1).applyQuaternion(footRotation)
	      )
	    ).multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI/2));
	    this.lowerLeg.rotation = new Quaternion().setFromRotationMatrix(
	      new THREE.Matrix4().lookAt(
	        footPosition,
	        lowerLegPosition,
	        new Vector3(0, 0, 1).applyQuaternion(footRotation)
	      )
	    ).multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI/2));

      // this.lowerLeg.position = lowerLegPosition;

      // this.foot.position = footPosition;
      this.foot.rotation = footRotation.multiply(new Quaternion().setFromUnitVectors(new Vector3(0, -1, 0), new Vector3(0, 0, 1)));

      this.standing = true;
      this.foot.stickTransform.position = footPosition;
    } else {
    	this.upperLeg.localRotation = this.upperLeg.localRotation.slerp(new Quaternion(), 0.1);
    	this.lowerLeg.localRotation = this.lowerLeg.localRotation.slerp(new Quaternion(), 0.1);
    	this.foot.localRotation = this.foot.localRotation.slerp(new Quaternion().setFromUnitVectors(new Vector3(0, -1, 0), new Vector3(0, 0, 1)), 0.1);
      /* const direction = this.foot.position.sub(this.upperLeg.position).normalize().lerp(new Vector3(0, -1, 0), 0.1);
      const lowerLegPosition = this.upperLeg.position.add(direction.clone().multiplyScalar(upperLegLength));
      const footPosition = this.lowerLeg.position.add(direction.clone().multiplyScalar(lowerLegLength));

      this.upperLeg.rotation = new Quaternion().setFromRotationMatrix(
	      new THREE.Matrix4().lookAt(
	        lowerLegPosition,
	        this.upperLeg.position,
	        new Vector3(0, 0, 1)
	      )
	    ).multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI/2));
	    this.lowerLeg.rotation = new Quaternion().setFromRotationMatrix(
	      new THREE.Matrix4().lookAt(
	        footPosition,
	        lowerLegPosition,
	        new Vector3(0, 0, 1)
	      )
	    ).multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI/2));
	    this.foot.rotation = this.foot.rotation.slerp(new Quaternion(), 0.1); */

      //this.lowerLeg.position = lowerLegPosition;
      //this.foot.position = footPosition; */

      this.standing = false;
      // this.foot.stickTransform.position = this.foot.position;
    }
	}
}

class LegsManager extends MonoBehavior
{
	constructor(...args) {
    super(...args);

    const shoulderTransforms = this.GetOrAddComponent(ShoulderTransforms);
    this.hips = shoulderTransforms.hips;
    this.leftLeg = new GameObject().AddComponent(Leg);
    this.hips.AddChild(this.leftLeg.transform);
    this.rightLeg = new GameObject().AddComponent(Leg);
    this.hips.AddChild(this.rightLeg.transform);

    this.rightLeg.foot.stickTransform.position = this.rightLeg.foot.position;
    this.rightLeg.left = false;

    // this.spineLength = 0.3525347660851869;

    const poseManager = this.GetOrAddComponent(PoseManager);
    this.hmdTransformRef = poseManager.vrTransforms.head;
  }

	LateUpdate() {
    const hipsFloorPosition = this.hips.position;
    hipsFloorPosition.y = 0;
    const hipsFloorEuler = new THREE.Euler().setFromQuaternion(this.hips.rotation, 'YXZ');
    hipsFloorEuler.x = 0;
    hipsFloorEuler.z = 0;
    const hipsFloorRotation = new Quaternion().setFromEuler(hipsFloorEuler);
    const planeMatrix = new THREE.Matrix4().compose(hipsFloorPosition, hipsFloorRotation, Vector3.one);
    const planeMatrixInverse = new THREE.Matrix4().getInverse(planeMatrix);

    const position = new Vector3();
    const quaternion = new Quaternion();
    const scale = new Vector3();
    new THREE.Matrix4().compose(this.leftLeg.foot.stickTransform.position, this.leftLeg.foot.stickTransform.rotation, Vector3.one)
      .premultiply(planeMatrixInverse)
      .decompose(position, quaternion, scale);
    const leftFootPosition = position.clone();
    const leftFootRotation = quaternion.clone();

    new THREE.Matrix4().compose(this.rightLeg.foot.stickTransform.position, this.rightLeg.foot.stickTransform.rotation, Vector3.one)
      .premultiply(planeMatrixInverse)
      .decompose(position, quaternion, scale);
    const rightFootPosition = position.clone();
    const rightFootRotation = quaternion.clone();

    {
			const leftFootAngle = Math.atan2(leftFootPosition.clone().normalize().z, leftFootPosition.clone().normalize().x);
			const leftAngleDiff = _angleDiff(Math.PI/2, leftFootAngle);
			const rightFootAngle = Math.atan2(rightFootPosition.clone().normalize().z, rightFootPosition.clone().normalize().x);
			const rightAngleDiff = _angleDiff(Math.PI/2, rightFootAngle);

	    if (rightAngleDiff < Math.PI*0.2) {
				const rightFootDistance = Math.max(Math.min(Math.sqrt(rightFootPosition.x*rightFootPosition.x + rightFootPosition.z*rightFootPosition.z), 0.1), 0.2);
				rightFootPosition.x = rightFootDistance;
				rightFootPosition.z = 0;
				this.rightLeg.foot.stickTransform.position = rightFootPosition.clone().applyMatrix4(planeMatrix);
			}
			if (rightAngleDiff > Math.PI/2+Math.PI*0.2) {
				const rightFootDistance = Math.max(Math.min(Math.sqrt(rightFootPosition.x*rightFootPosition.x + rightFootPosition.z*rightFootPosition.z), 0.1), 0.2);
				rightFootPosition.x = rightFootDistance;
				rightFootPosition.z = 0;
				this.rightLeg.foot.stickTransform.position = rightFootPosition.clone().applyMatrix4(planeMatrix);
			}
			if (leftAngleDiff > -Math.PI*0.2) {
				const leftFootDistance = Math.max(Math.min(Math.sqrt(leftFootPosition.x*leftFootPosition.x + leftFootPosition.z*leftFootPosition.z), 0.1), 0.2);
				leftFootPosition.x = -leftFootDistance;
				leftFootPosition.z = 0;
				this.leftLeg.foot.stickTransform.position = leftFootPosition.clone().applyMatrix4(planeMatrix);
			}
			if (leftAngleDiff < -Math.PI/2-Math.PI*0.2) {
				const leftFootDistance = Math.max(Math.min(Math.sqrt(leftFootPosition.x*leftFootPosition.x + leftFootPosition.z*leftFootPosition.z), 0.1), 0.2);
				leftFootPosition.x = -leftFootDistance;
				leftFootPosition.z = 0;
				this.leftLeg.foot.stickTransform.position = leftFootPosition.clone().applyMatrix4(planeMatrix);
			}
		}
		{
      const leftFootEuler = new THREE.Euler().setFromQuaternion(leftFootRotation, 'YXZ');
    	if (leftFootEuler.y < -Math.PI*0.15) {
    		leftFootEuler.y = -Math.PI*0.15;
    		new THREE.Matrix4().compose(Vector3.zero, new Quaternion().setFromEuler(leftFootEuler), Vector3.one)
		      .premultiply(planeMatrix)
		      .decompose(position, quaternion, scale);
    		this.leftLeg.foot.stickTransform.rotation = quaternion;
    	}
    	if (leftFootEuler.y > Math.PI*0.15) {
    		leftFootEuler.y = Math.PI*0.15;
    		new THREE.Matrix4().compose(Vector3.zero, new Quaternion().setFromEuler(leftFootEuler), Vector3.one)
		      .premultiply(planeMatrix)
		      .decompose(position, quaternion, scale);
    		this.leftLeg.foot.stickTransform.rotation = quaternion;
    	}

	    const rightFootEuler = new THREE.Euler().setFromQuaternion(rightFootRotation, 'YXZ');
    	if (rightFootEuler.y < -Math.PI*0.15) {
    		rightFootEuler.y = -Math.PI*0.15;
    		new THREE.Matrix4().compose(Vector3.zero, new Quaternion().setFromEuler(rightFootEuler), Vector3.one)
		      .premultiply(planeMatrix)
		      .decompose(position, quaternion, scale);
    		this.rightLeg.foot.stickTransform.rotation = quaternion;
    	}
    	if (rightFootEuler.y > Math.PI*0.15) {
    		rightFootEuler.y = Math.PI*0.15;
    		new THREE.Matrix4().compose(Vector3.zero, new Quaternion().setFromEuler(rightFootEuler), Vector3.one)
		      .premultiply(planeMatrix)
		      .decompose(position, quaternion, scale);
    		this.rightLeg.foot.stickTransform.rotation = quaternion;
    	}
	  }
  }
}

export default LegsManager;
