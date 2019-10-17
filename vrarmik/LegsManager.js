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
    this.upperLeg.localPosition = new Vector3(0.07171520178403676, -0.1154526376107925, -0.013953604628355355);
    this.lowerLeg = new Transform();
    this.lowerLeg.localPosition = new Vector3(0.005757781010899271, -0.3811295375263364, -0.02434057165518574);
    this.foot = new Transform();
    this.foot.localPosition = new Vector3(0.002901996926509387, -0.40691825309716234, -0.05305202296204871);
    this.foot.stickTransform = new Transform();

    this.transform.AddChild(this.upperLeg);
    this.upperLeg.AddChild(this.lowerLeg);
    this.lowerLeg.AddChild(this.foot);

    this.foot.stickTransform.position = this.foot.position;
    this.upperLegLength = this.lowerLeg.localPosition.length();
    this.lowerLegLength = this.foot.localPosition.length();

    this.left = true;
    this.standing = true;

    this.hmdTransformRef = null
  }

  LateUpdate() {
		const hipsEuler = new THREE.Euler().setFromQuaternion(this.transform.rotation, 'YXZ');
		const upperLegEuler = new THREE.Euler().setFromQuaternion(this.foot.rotation, 'YXZ');
		let angleDiff = _angleDiff(hipsEuler.y, upperLegEuler.y);
		if (this.left) {
			angleDiff *= -1;
		}
		if (angleDiff < -Math.PI/3) {
			if (this.left) {
				upperLegEuler.y += Math.PI/3;
			} else {
				upperLegEuler.y -= Math.PI/3;
			}
		} else if (angleDiff > Math.PI/8) {
			if (this.left) {
				upperLegEuler.y -= Math.PI/8;
			} else {
				upperLegEuler.y += Math.PI/8;
			}
		}
		// this.upperLeg.rotation = new Quaternion().setFromEuler(upperLegEuler); 
		this.upperLeg.position = this.transform.position.add(
			new Vector3(-0.07171519845724106 * (this.left ? 1 : -1), -0.11545264720916748, 0.013953600078821182)
			  .applyQuaternion(this.transform.rotation)
	  );

    const {upperLegLength, lowerLegLength} = this;
    /* const upperLegLength = this.lowerLeg.localPosition.length();
    const lowerLegLength = this.foot.localPosition.length(); */
    const hypotenuseDistance = upperLegLength;
    const verticalDistance = Math.abs(this.upperLeg.position.y) / 2;
    if (verticalDistance < hypotenuseDistance) {
      const footPosition = this.foot.stickTransform.position;

      footPosition.y = 0;
      upperLegEuler.x = 0;
	    upperLegEuler.z = 0;
      const footRotation = new Quaternion().setFromEuler(upperLegEuler);

      const offsetDistance = Math.sqrt(hypotenuseDistance*hypotenuseDistance - verticalDistance*verticalDistance);
      const offsetDirection = footPosition.clone().sub(this.upperLeg.position)
        .cross(new Vector3(1, 0, 0).applyQuaternion(footRotation))
        .normalize();

      const lowerLegPosition = this.upperLeg.position.add(footPosition).divideScalar(2)
        .add(offsetDirection.clone().multiplyScalar(offsetDistance));

      this.upperLeg.rotation = new Quaternion().setFromRotationMatrix(
	      new THREE.Matrix4().lookAt(
	        lowerLegPosition,
	        this.upperLeg.position,
	        new Vector3(0, 0, 1)// .applyQuaternion(this.transform.rotation)
	      )
	    );
	    this.lowerLeg.rotation = new Quaternion().setFromRotationMatrix(
	      new THREE.Matrix4().lookAt(
	        footPosition,
	        lowerLegPosition,
	        new Vector3(0, 0, 1)// .applyQuaternion(this.transform.rotation)
	      )
	    );

      this.lowerLeg.position = lowerLegPosition;

      this.foot.position = footPosition;
      this.foot.rotation = footRotation;

      this.standing = true;
      this.foot.stickTransform.position = footPosition;
    } else {
      const direction = this.foot.position.sub(this.upperLeg.position).normalize().lerp(new Vector3(0, -1, 0), 0.1);
      const lowerLegPosition = this.upperLeg.position.add(direction.clone().multiplyScalar(upperLegLength));
      const footPosition = this.lowerLeg.position.add(direction.clone().multiplyScalar(lowerLegLength));

      this.upperLeg.rotation = new Quaternion().setFromRotationMatrix(
	      new THREE.Matrix4().lookAt(
	        lowerLegPosition,
	        this.upperLeg.position,
	        new Vector3(0, 0, 1)
	      )
	    );
	    this.lowerLeg.rotation = new Quaternion().setFromRotationMatrix(
	      new THREE.Matrix4().lookAt(
	        footPosition,
	        lowerLegPosition,
	        new Vector3(0, 0, 1)
	      )
	    );
	    this.foot.rotation = this.foot.rotation.slerp(new Quaternion(), 0.1);

      this.lowerLeg.position = lowerLegPosition;
      this.foot.position = footPosition;

      this.standing = false;
      this.foot.stickTransform.position = footPosition;
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

    this.rightLeg.upperLeg.localPosition = this.rightLeg.upperLeg.localPosition.multiply(new Vector3(-1, 1, 1));
    this.rightLeg.lowerLeg.localPosition = this.rightLeg.lowerLeg.localPosition.multiply(new Vector3(-1, 1, 1));
    this.rightLeg.foot.localPosition = this.rightLeg.foot.localPosition.multiply(new Vector3(-1, 1, 1));
    this.rightLeg.foot.stickTransform.position = this.rightLeg.foot.position;
    this.rightLeg.left = false;

    // this.spineLength = 0.3525347660851869;

    const poseManager = this.GetOrAddComponent(PoseManager);
    this.hmdTransformRef = poseManager.vrTransforms.head;
  }

	LateUpdate() {
    /* this.hips.position = this.hmdTransformRef.position.add(new Vector3(0, -this.spineLength, 0));
    this.hips.rotation = this.hmdTransformRef.rotation; */

    const hipsFloorPosition = this.hips.position;
    hipsFloorPosition.y = 0;
    const hipsFloorEuler = new THREE.Euler().setFromQuaternion(this.hips.rotation, 'YXZ');
    hipsFloorEuler.x = 0;
    hipsFloorEuler.z = 0;
    const hipsFloorRotation = new Quaternion().setFromEuler(hipsFloorEuler);
    const planeMatrix = new THREE.Matrix4().compose(hipsFloorPosition, hipsFloorRotation, Vector3.one);
    const planeMatrixInverse = new THREE.Matrix4().getInverse(planeMatrix);
    const leftFootPosition = this.leftLeg.foot.stickTransform.position.applyMatrix4(planeMatrixInverse);
    const leftFootVector = new Vector2(leftFootPosition.x, leftFootPosition.z);
    const rightFootPosition = this.rightLeg.foot.stickTransform.position.applyMatrix4(planeMatrixInverse);
    const rightFootVector = new Vector2(rightFootPosition.x, rightFootPosition.z);
		const legsBox = new THREE.Box2(
			leftFootVector.clone().min(rightFootVector.clone()).add(new Vector2(-0.1, -0.1)),
			leftFootVector.clone().max(rightFootVector.clone()).add(new Vector2(0.1, 0.1))
		);
		const originPoint = new Vector2(0, 0);

    // console.log('vectors', leftFootPosition.toArray().join(','), leftFootVector.toArray().join(','));
		if (originPoint.x < legsBox.min.x) {
			const leftmostFoot = leftFootPosition.x <= rightFootPosition.x ? this.leftLeg.foot : this.rightLeg.foot;
			leftmostFoot.stickTransform.position = leftmostFoot.stickTransform.position.add(new Vector3(originPoint.x - legsBox.min.x - 0.2, 0, 0).applyQuaternion(hipsFloorRotation));
		}
		if (originPoint.x > legsBox.max.x) {
			const rightmostFoot = leftFootPosition.x >= rightFootPosition.x ? this.leftLeg.foot : this.rightLeg.foot;
			rightmostFoot.stickTransform.position = rightmostFoot.stickTransform.position.add(new Vector3(originPoint.x - legsBox.max.x + 0.2, 0, 0).applyQuaternion(hipsFloorRotation));
		}
		if (originPoint.y < legsBox.min.y) {
			const upmostFoot = leftFootPosition.y <= rightFootPosition.y ? this.leftLeg.foot : this.rightLeg.foot;
			upmostFoot.stickTransform.position = upmostFoot.stickTransform.position.add(new Vector3(0, 0, originPoint.y - legsBox.min.y - 0.2).applyQuaternion(hipsFloorRotation));
		}
		if (originPoint.y > legsBox.max.y) {
			const downmostFoot = leftFootPosition.y >= rightFootPosition.y ? this.leftLeg.foot : this.rightLeg.foot;
			downmostFoot.stickTransform.position = downmostFoot.stickTransform.position.add(new Vector3(0, 0, originPoint.y - legsBox.min.y + 0.2).applyQuaternion(hipsFloorRotation));
		}

		const legsWidth = legsBox.max.x - legsBox.min.x;
		const legsHeight = legsBox.max.y - legsBox.min.y;
		const distance = Math.sqrt(legsWidth*legsWidth + legsHeight*legsHeight);
		if (distance > 1) {
			const leftDistance = leftFootVector.length();
			const rightDistance = rightFootVector.length();
			if (leftDistance > rightDistance) {
				const direction = leftFootVector.multiplyScalar(-1).normalize();
				const offset = direction.clone().multiplyScalar(0.2);
				this.leftLeg.foot.stickTransform.position = this.leftLeg.foot.stickTransform.position.add(new Vector3(offset.x, 0, offset.y).applyQuaternion(hipsFloorRotation));
			} else {
		    const direction = rightFootVector.multiplyScalar(-1).normalize();
				const offset = direction.clone().multiplyScalar(0.2);
				this.rightLeg.foot.stickTransform.position = this.rightLeg.foot.stickTransform.position.add(new Vector3(offset.x, 0, offset.y).applyQuaternion(hipsFloorRotation));
			}
		}
	}
}

export default LegsManager;
