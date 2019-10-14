import {Vector3, Quaternion, Transform, GameObject, MonoBehavior, Mathf} from './Unity.js';
import ArmTransforms from './ArmTransforms.js';
import ShoulderTransforms from './ShoulderTransforms.js';
import ShoulderPoser from './ShoulderPoser.js';
import VectorHelpers from './Utils/VectorHelpers.js';

class ArmIKElbowSettings
{
	constructor() {
		this.calcElbowAngle = true;
		this.clampElbowAngle = true;
		this.softClampElbowAngle = true;
		this.maxAngle = 175;
		this.minAngle = 13;
		this.softClampRange = 10;
		this.offsetAngle = 135;
		this.yWeight = -60;
		this.zWeightTop = 260;
		this.zWeightBottom = -100;
		this.zBorderY = -.25;
		this.zDistanceStart = .6;
		this.xWeight = -50;
		this.xDistanceStart = .1;
	}
}

class BeforePositioningSettings
{
	constructor() {
		this.correctElbowOutside = true;
		this.weight = -0.5;
		this.startBelowZ = .4;
		this.startAboveY = 0.1;
	}
}

class ElbowCorrectionSettings
{
	constructor() {
		this.useFixedElbowWhenNearShoulder = true;
		this.startBelowDistance = .5;
		this.startBelowY = 0.1;
		this.weight = 2;
		this.localElbowPos = new Vector3(0.3, -1, -2);
	}
}

class HandSettings
{
	constructor() {
		this.useWristRotation = true;
		this.rotateElbowWithHandRight = true;
		this.rotateElbowWithHandForward = true;
		this.handDeltaPow = 1.5;
		this.handDeltaFactor = -.3;
		this.handDeltaOffset = 45;
		// todo fix rotateElbowWithHandForward with factor != 1 -> horrible jumps. good value would be between [0.4, 0.6]
		this.handDeltaForwardPow = 2;
		this.handDeltaForwardFactor = 1;
		this.handDeltaForwardOffset = 0;
		this.handDeltaForwardDeadzone = .3;
		this.rotateElbowWithHandDelay = .08;
	}
}

	class VRArmIK extends MonoBehavior
	{
		constructor(...args) {
      super(...args);

			this.arm = new GameObject().GetComponent(ArmTransforms);
			this.shoulder = null;
			this.shoulderPoser = null;
			this.target = new Transform();
			this.left = true;

			this.elbowSettings = new ArmIKElbowSettings();
			this.beforePositioningSettings = new BeforePositioningSettings();
			this.elbowCorrectionSettings = new ElbowCorrectionSettings();
			this.handSettings = new HandSettings();

			this.nextLowerArmAngle = new Vector3();

		  this.upperArmStartRotation = new Quaternion();
		  this.lowerArmStartRotation = new Quaternion();
		  this.wristStartRotation = new Quaternion();
		  this.handStartRotation = new Quaternion();

			this.interpolatedDeltaElbow = 0;
      this.interpolatedDeltaElbowForward = 0;
    }

		Awake()
		{
			this.upperArmStartRotation = this.arm.upperArm.rotation;
			this.lowerArmStartRotation = this.arm.lowerArm.rotation;
			this.wristStartRotation = Quaternion.identity;
			if (this.arm.wrist1 !== null)
				this.wristStartRotation = this.arm.wrist1.rotation;
			this.handStartRotation = this.arm.hand.rotation;
		}

		OnEnable()
		{
			this.setUpperArmRotation(Quaternion.identity);
			this.setLowerArmRotation(Quaternion.identity);
			this.setHandRotation(Quaternion.identity);
		}

		LateUpdate()
		{
			this.updateUpperArmPosition();
			this.calcElbowInnerAngle();
			this.rotateShoulder();
			this.correctElbowRotation();
			if (this.elbowSettings.calcElbowAngle)
			{
				this.positionElbow();
				if (this.elbowCorrectionSettings.useFixedElbowWhenNearShoulder)
					this.correctElbowAfterPositioning();
				if (this.handSettings.rotateElbowWithHandRight)
					this.rotateElbowWithHandRight();
				if (this.handSettings.rotateElbowWithHandForward)
					this.rotateElbowWithHandFoward();
				this.rotateHand();
			}
		}

		updateArmAndTurnElbowUp()
		{
			this.updateUpperArmPosition();
			this.calcElbowInnerAngle();
			this.rotateShoulder();
			this.correctElbowRotation();
		}

		updateUpperArmPosition()
		{
			//arm.upperArm.position = shoulderAnker.transform.position;
		}

		calcElbowInnerAngle()
		{
		  const eulerAngles = new Vector3();
			const targetShoulderDistance = (this.target.position - this.upperArmPos).magnitude;
			let innerAngle;

			if (targetShoulderDistance > this.arm.armLength)
			{
				innerAngle = 0;
			}
			else
			{
				innerAngle = Mathf.Acos(Mathf.Clamp((Mathf.Pow(this.arm.upperArmLength, 2) + Mathf.Pow(this.arm.lowerArmLength, 2) -
												Mathf.Pow(targetShoulderDistance, 2)) / (2 * this.arm.upperArmLength * this.arm.lowerArmLength), -1, 1)) * Mathf.Rad2Deg;
				if (this.left)
					innerAngle = 180 - innerAngle;
				else
					innerAngle = 180 + innerAngle;
				if (isNaN(innerAngle))
				{
					innerAngle = 180;
				}
			}

			eulerAngles.y = innerAngle;
			this.nextLowerArmAngle = eulerAngles;
		}

		//source: https://github.com/NickHardeman/ofxIKArm/blob/master/src/ofxIKArm.cpp
		rotateShoulder()
		{
			const eulerAngles = new Vector3();
			const targetShoulderDirection = (target.position - upperArmPos).normalized;
			const targetShoulderDistance = (target.position - upperArmPos).magnitude;

			eulerAngles.y = (this.left ? -1 : 1) *
				Mathf.Acos(Mathf.Clamp((Mathf.Pow(targetShoulderDistance, 2) + Mathf.Pow(this.arm.upperArmLength, 2) -
							Mathf.Pow(this.arm.lowerArmLength, 2)) / (2 * targetShoulderDistance * this.arm.upperArmLength), -1, 1)) * Mathf.Rad2Deg;
			if (isNaN(eulerAngles.y))
				eulerAngles.y = 0;


			const shoulderRightRotation = Quaternion.FromToRotation(this.armDirection, targetShoulderDirection);
			this.setUpperArmRotation(shoulderRightRotation);
			this.arm.upperArm.rotation = Quaternion.AngleAxis(eulerAngles.y, lowerArmRotation * Vector3.up) * this.arm.upperArm.rotation;
			this.setLowerArmLocalRotation(Quaternion.Euler(this.nextLowerArmAngle));
		}

		getElbowTargetAngle()
		{
			const localHandPosNormalized = this.shoulderAnker.InverseTransformPoint(this.handPos) / this.arm.armLength;

			// angle from Y
			let angle = this.elbowSettings.yWeight * localHandPosNormalized.y + this.elbowSettings.offsetAngle;

			// angle from Z
			/*angle += Mathf.Lerp(elbowSettings.zWeightBottom, elbowSettings.zWeightTop, Mathf.Clamp01((localHandPosNormalized.y + 1f) - elbowSettings.zBorderY)) *
					 (Mathf.Max(elbowSettings.zDistanceStart - localHandPosNormalized.z, 0f));*/
			if (localHandPosNormalized.y > 0)
				angle += this.elbowSettings.zWeightTop * (Mathf.Max(this.elbowSettings.zDistanceStart - localHandPosNormalized.z, 0) * Mathf.Max(localHandPosNormalized.y, 0));
			else
				angle += this.elbowSettings.zWeightBottom * (Mathf.Max(this.elbowSettings.zDistanceStart - localHandPosNormalized.z, 0) * Mathf.Max(-localHandPosNormalized.y, 0));


			// angle from X
			angle += this.elbowSettings.xWeight * Mathf.Max(localHandPosNormalized.x * (this.left ? 1.0 : -1.0) + this.elbowSettings.xDistanceStart, 0);

			if (this.elbowSettings.clampElbowAngle)
			{
				if (this.elbowSettings.softClampElbowAngle)
				{
					if (angle < this.elbowSettings.minAngle + this.elbowSettings.softClampRange)
					{
						const a = this.elbowSettings.minAngle + this.elbowSettings.softClampRange - angle;
						angle = this.elbowSettings.minAngle + this.elbowSettings.softClampRange * (1 - Mathf.Log(1 + a) * 3);
					}
				}
				else
				{
					angle = Mathf.Clamp(angle, this.elbowSettings.minAngle, this.elbowSettings.maxAngle);
				}
			}

			if (this.left)
				angle *= -1;

			return angle;
		}

		correctElbowRotation()
		{
			const s = beforePositioningSettings;

			const localTargetPos = this.shoulderAnker.InverseTransformPoint(target.position) / arm.armLength;
			const elbowOutsideFactor = Mathf.Clamp01(
									 Mathf.Clamp01((s.startBelowZ - localTargetPos.z) /
												   Mathf.Abs(s.startBelowZ) * .5) *
									 Mathf.Clamp01((localTargetPos.y - s.startAboveY) /
												   Mathf.Abs(s.startAboveY)) *
									 Mathf.Clamp01(1 - localTargetPos.x * (this.left ? -1 : 1))
								 ) * s.weight;

			const shoulderHandDirection = (this.upperArmPos - this.handPos).normalized;
		  const targetDir = this.shoulder.transform.rotation * (Vector3.up + (s.correctElbowOutside ? (this.armDirection + Vector3.forward * -.2) * elbowOutsideFactor : Vector3.zero));
			const cross = Vector3.Cross(shoulderHandDirection, targetDir * 1000);

			const upperArmUp = upperArmRotation * Vector3.up;

			const elbowTargetUp = Vector3.Dot(upperArmUp, targetDir);
			const elbowAngle = Vector3.Angle(cross, upperArmUp) + (this.left ? 0 : 180);
			const rotation = Quaternion.AngleAxis(elbowAngle * Mathf.Sign(elbowTargetUp), shoulderHandDirection);
			this.arm.upperArm.rotation = rotation * this.arm.upperArm.rotation;
		}

		/// <summary>
		/// reduces calculation problems when hand is moving around shoulder XZ coordinates -> forces elbow to be outside of body
		/// </summary>
		correctElbowAfterPositioning()
		{
			const s = this.elbowCorrectionSettings;
			const localTargetPos = this.shoulderAnker.InverseTransformPoint(this.target.position) / this.arm.armLength;
			const shoulderHandDirection = (this.upperArmPos - this.handPos).normalized;
			const elbowPos = s.localElbowPos;

			if (this.left)
				elbowPos.x *= -1;

			const targetDir = this.shoulder.transform.rotation * elbowPos.normalized;
  		const cross = Vector3.Cross(shoulderHandDirection, targetDir);

			const upperArmUp = this.upperArmRotation * Vector3.up;


			let distance = this.target.position - this.upperArmPos;
			distance = distance.magnitude * this.shoulder.transform.InverseTransformDirection(distance / distance.magnitude);

			const weight = Mathf.Clamp01(Mathf.Clamp01((s.startBelowDistance - distance.xz().magnitude / arm.armLength) /
						   s.startBelowDistance) * s.weight + Mathf.Clamp01((-distance.z + .1) * 3)) *
						   Mathf.Clamp01((s.startBelowY - localTargetPos.y) /
										 s.startBelowY);

		  const elbowTargetUp = Vector3.Dot(upperArmUp, targetDir);
  		const elbowAngle2 = Vector3.Angle(cross, upperArmUp) + (this.left ? 0 : 180);
			const rotation = Quaternion.AngleAxis((elbowAngle2 * Mathf.Sign(elbowTargetUp)).toSignedEulerAngle() * Mathf.Clamp(weight, 0, 1), shoulderHandDirection);
			this.arm.upperArm.rotation = rotation * this.arm.upperArm.rotation;
		}

		rotateElbow(angle)
		{
			const shoulderHandDirection = (this.upperArmPos - this.handPos).normalized;

			const rotation = Quaternion.AngleAxis(angle, shoulderHandDirection);
			this.setUpperArmRotation(rotation * this.upperArmRotation);
		}

		//source: https://github.com/NickHardeman/ofxIKArm/blob/master/src/ofxIKArm.cpp
		positionElbow()
		{
			const targetElbowAngle = this.getElbowTargetAngle();
			this.rotateElbow(targetElbowAngle);
		}


		rotateElbowWithHandRight()
		{
			const s = this.handSettings;
			let handUpVec = this.target.rotation * Vector3.up;
			const forwardAngle = VectorHelpers.getAngleBetween(lowerArmRotation * Vector3.right, this.target.rotation * Vector3.right,
				lowerArmRotation * Vector3.up, lowerArmRotation * Vector3.forward);

			// todo reduce influence if hand local forward rotation is high (hand tilted inside)
			const handForwardRotation = Quaternion.AngleAxis(-forwardAngle, lowerArmRotation * Vector3.forward);
			handUpVec = handForwardRotation * handUpVec;

			const elbowTargetAngle = VectorHelpers.getAngleBetween(this.lowerArmRotation * Vector3.up, handUpVec,
				this.lowerArmRotation * Vector3.forward, this.lowerArmRotation * this.armDirection);

			let deltaElbow = (elbowTargetAngle + (this.left ? -s.handDeltaOffset : s.handDeltaOffset)) / 180;

			deltaElbow = Mathf.Sign(deltaElbow) * Mathf.Pow(Mathf.Abs(deltaElbow), s.handDeltaPow) * 180 * s.handDeltaFactor;
			this.interpolatedDeltaElbow =
				Mathf.LerpAngle(this.interpolatedDeltaElbow, deltaElbow, Time.deltaTime / s.rotateElbowWithHandDelay);
			this.rotateElbow(this.interpolatedDeltaElbow);
		}

		rotateElbowWithHandFoward()
		{
			const s = this.handSettings;
			const handRightVec = this.target.rotation * this.armDirection;

		  const elbowTargetAngleForward = VectorHelpers.getAngleBetween(this.lowerArmRotation * armDirection, handRightVec,
				this.lowerArmRotation * Vector3.up, this.lowerArmRotation * Vector3.forward);

			let deltaElbowForward = (elbowTargetAngleForward + (this.left ? -s.handDeltaForwardOffset : s.handDeltaForwardOffset)) / 180;

			if (Mathf.Abs(deltaElbowForward) < s.handDeltaForwardDeadzone)
				deltaElbowForward = 0;
			else
			{
				deltaElbowForward = (deltaElbowForward - Mathf.Sign(deltaElbowForward) * s.handDeltaForwardDeadzone) / (1 - s.handDeltaForwardDeadzone);
			}

			deltaElbowForward = Mathf.Sign(deltaElbowForward) * Mathf.Pow(Mathf.Abs(deltaElbowForward), s.handDeltaForwardPow) * 180;
			this.interpolatedDeltaElbowForward = Mathf.LerpAngle(this.interpolatedDeltaElbowForward, deltaElbowForward, Time.deltaTime / s.rotateElbowWithHandDelay);

			const signedInterpolated = this.interpolatedDeltaElbowForward.toSignedEulerAngle();
			this.rotateElbow(signedInterpolated * s.handDeltaForwardFactor);
		}

		rotateHand()
		{
			if (this.handSettings.useWristRotation)
			{
				let handUpVec = this.target.rotation * Vector3.up;
				const forwardAngle = VectorHelpers.getAngleBetween(this.lowerArmRotation * Vector3.right, target.rotation * Vector3.right,
					this.lowerArmRotation * Vector3.up, this.lowerArmRotation * Vector3.forward);

				// todo reduce influence if hand local forward rotation is high (hand tilted inside)
				const handForwardRotation = Quaternion.AngleAxis(-forwardAngle, this.lowerArmRotation * Vector3.forward);
				handUpVec = handForwardRotation * handUpVec;

				let elbowTargetAngle = VectorHelpers.getAngleBetween(this.lowerArmRotation * Vector3.up, handUpVec,
					this.lowerArmRotation * Vector3.forward, this.lowerArmRotation * this.armDirection);

				elbowTargetAngle = Mathf.Clamp(elbowTargetAngle, -90, 90);
				if (arm.wrist1 != null)
					this.setWrist1Rotation(Quaternion.AngleAxis(elbowTargetAngle * .3, this.lowerArmRotation * this.armDirection) * this.lowerArmRotation);
				if (arm.wrist2 != null)
					this.setWrist2Rotation(Quaternion.AngleAxis(elbowTargetAngle * .8, this.lowerArmRotation * this.armDirection) * this.lowerArmRotation);
			}
			this.setHandRotation(target.rotation);
		}

		removeShoulderRightRotation(direction) {
			return Quaternion.AngleAxis(-this.shoulderPoser.shoulderRightRotation, this.shoulder.transform.right) * this.direction;
		}

		get armDirection() {
			return this.left ? Vector3.left : Vector3.right;
		}
		get upperArmPos() {
			return this.arm.upperArm.position;
		}
		get lowerArmPos() {
			return this.arm.lowerArm.position;
		}
		get handPos() {
			return this.arm.hand.position;
		}
		get shoulderAnker() {
			return this.left ? this.shoulder.leftShoulderAnchor : this.shoulder.rightShoulderAnchor;
		}

		get upperArmRotation() {
			return this.arm.upperArm.rotation * Quaternion.Inverse(this.upperArmStartRotation);
		}
		get lowerArmRotation() {
			return this.arm.lowerArm.rotation * Quaternion.Inverse(this.lowerArmStartRotation);
		}
		get handRotation() {
			return this.arm.hand.rotation * Quaternion.Inverse(this.handStartRotation);
		}

		setUpperArmRotation(rotation) {
			return this.arm.upperArm.rotation = rotation * this.upperArmStartRotation;
		}
		setLowerArmRotation(rotation) {
			return this.arm.lowerArm.rotation = rotation * this.lowerArmStartRotation;
		}
		setLowerArmLocalRotation(rotation) {
			return this.arm.lowerArm.rotation = this.upperArmRotation * rotation * this.lowerArmStartRotation;
		}
		setWrist1Rotation(rotation) {
			return this.arm.wrist1.rotation = rotation * this.wristStartRotation;
		}
		setWrist2Rotation(rotation) {
			return this.arm.wrist2.rotation = rotation * this.wristStartRotation;
		}
		setWristLocalRotation(rotation) {
			return this.arm.wrist1.rotation = this.arm.lowerArm.rotation * rotation * this.wristStartRotation;
    }
		setHandRotation(rotation) {
			return this.arm.hand.rotation = this.arm.hand.rotation = rotation * this.handStartRotation;
		}
	}

export default VRArmIK;
