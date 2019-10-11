import ArmTransforms from './ArmTransforms.js';
import ShoulderTransforms from './ShoulderTransforms.js';
import ShoulderPoser from './ShoulderPoser.js';

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

	class VRArmIK
	{
		constructor() {
			this.arm = new ArmTransforms(); // XXX these need to be this'd below
			this.shoulder = ShoulderTransforms();
			this.shoulderPoser = new ShoulderPoser();
			this.target = new Transform();
			this.left = true;

			this.elbowSettings = new ArmIKElbowSettings();
			this.beforePositioningSettings = new BeforePositioningSettings();
			this.elbowCorrectionSettings = ElbowCorrectionSettings();
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
			upperArmStartRotation = arm.upperArm.rotation;
			lowerArmStartRotation = arm.lowerArm.rotation;
			wristStartRotation = Quaternion.identity;
			if (arm.wrist1 != null)
				wristStartRotation = arm.wrist1.rotation;
			handStartRotation = arm.hand.rotation;
		}

		OnEnable()
		{
			setUpperArmRotation(Quaternion.identity);
			setLowerArmRotation(Quaternion.identity);
			setHandRotation(Quaternion.identity);
		}

		LateUpdate()
		{
			updateUpperArmPosition();
			calcElbowInnerAngle();
			rotateShoulder();
			correctElbowRotation();
			if (elbowSettings.calcElbowAngle)
			{
				positionElbow();
				if (elbowCorrectionSettings.useFixedElbowWhenNearShoulder)
					correctElbowAfterPositioning();
				if (handSettings.rotateElbowWithHandRight)
					rotateElbowWithHandRight();
				if (handSettings.rotateElbowWithHandForward)
					rotateElbowWithHandFoward();
				rotateHand();
			}
		}

		updateArmAndTurnElbowUp()
		{
			updateUpperArmPosition();
			calcElbowInnerAngle();
			rotateShoulder();
			correctElbowRotation();
		}

		updateUpperArmPosition()
		{
			//arm.upperArm.position = shoulderAnker.transform.position;
		}

		calcElbowInnerAngle()
		{
			Vector3 eulerAngles = new Vector3();
			float targetShoulderDistance = (target.position - upperArmPos).magnitude;
			float innerAngle;

			if (targetShoulderDistance > arm.armLength)
			{
				innerAngle = 0;
			}
			else
			{
				innerAngle = Mathf.Acos(Mathf.Clamp((Mathf.Pow(arm.upperArmLength, 2) + Mathf.Pow(arm.lowerArmLength, 2) -
												Mathf.Pow(targetShoulderDistance, 2)) / (2 * arm.upperArmLength * arm.lowerArmLength), -1, 1)) * Mathf.Rad2Deg;
				if (left)
					innerAngle = 180 - innerAngle;
				else
					innerAngle = 180 + innerAngle;
				if (float.IsNaN(innerAngle))
				{
					innerAngle = 180;
				}
			}

			eulerAngles.y = innerAngle;
			nextLowerArmAngle = eulerAngles;
		}

		//source: https://github.com/NickHardeman/ofxIKArm/blob/master/src/ofxIKArm.cpp
		rotateShoulder()
		{
			Vector3 eulerAngles = new Vector3();
			Vector3 targetShoulderDirection = (target.position - upperArmPos).normalized;
			float targetShoulderDistance = (target.position - upperArmPos).magnitude;

			eulerAngles.y = (left ? -1 : 1) *
				Mathf.Acos(Mathf.Clamp((Mathf.Pow(targetShoulderDistance, 2) + Mathf.Pow(arm.upperArmLength, 2) -
							Mathf.Pow(arm.lowerArmLength, 2)) / (2 * targetShoulderDistance * arm.upperArmLength), -1, 1)) * Mathf.Rad2Deg;
			if (float.IsNaN(eulerAngles.y))
				eulerAngles.y = 0;


			Quaternion shoulderRightRotation = Quaternion.FromToRotation(armDirection, targetShoulderDirection);
			setUpperArmRotation(shoulderRightRotation);
			arm.upperArm.rotation = Quaternion.AngleAxis(eulerAngles.y, lowerArmRotation * Vector3.up) * arm.upperArm.rotation;
			setLowerArmLocalRotation(Quaternion.Euler(nextLowerArmAngle));
		}

		getElbowTargetAngle()
		{
			Vector3 localHandPosNormalized = shoulderAnker.InverseTransformPoint(handPos) / arm.armLength;

			// angle from Y
			var angle = elbowSettings.yWeight * localHandPosNormalized.y + elbowSettings.offsetAngle;

			// angle from Z
			/*angle += Mathf.Lerp(elbowSettings.zWeightBottom, elbowSettings.zWeightTop, Mathf.Clamp01((localHandPosNormalized.y + 1f) - elbowSettings.zBorderY)) *
					 (Mathf.Max(elbowSettings.zDistanceStart - localHandPosNormalized.z, 0f));*/
			if (localHandPosNormalized.y > 0)
				angle += elbowSettings.zWeightTop * (Mathf.Max(elbowSettings.zDistanceStart - localHandPosNormalized.z, 0) * Mathf.Max(localHandPosNormalized.y, 0));
			else
				angle += elbowSettings.zWeightBottom * (Mathf.Max(elbowSettings.zDistanceStart - localHandPosNormalized.z, 0) * Mathf.Max(-localHandPosNormalized.y, 0));


			// angle from X
			angle += elbowSettings.xWeight * Mathf.Max(localHandPosNormalized.x * (left ? 1.0 : -1.0) + elbowSettings.xDistanceStart, 0);

			if (elbowSettings.clampElbowAngle)
			{
				if (elbowSettings.softClampElbowAngle)
				{
					if (angle < elbowSettings.minAngle + elbowSettings.softClampRange)
					{
						float a = elbowSettings.minAngle + elbowSettings.softClampRange - angle;
						angle = elbowSettings.minAngle + elbowSettings.softClampRange * (1 - Mathf.Log(1 + a) * 3);
					}
				}
				else
				{
					angle = Mathf.Clamp(angle, elbowSettings.minAngle, elbowSettings.maxAngle);
				}
			}

			if (left)
				angle *= -1;

			return angle;
		}

		correctElbowRotation()
		{
			var s = beforePositioningSettings;

			Vector3 localTargetPos = shoulderAnker.InverseTransformPoint(target.position) / arm.armLength;
			float elbowOutsideFactor = Mathf.Clamp01(
									 Mathf.Clamp01((s.startBelowZ - localTargetPos.z) /
												   Mathf.Abs(s.startBelowZ) * .5) *
									 Mathf.Clamp01((localTargetPos.y - s.startAboveY) /
												   Mathf.Abs(s.startAboveY)) *
									 Mathf.Clamp01(1 - localTargetPos.x * (left ? -1 : 1))
								 ) * s.weight;

			Vector3 shoulderHandDirection = (upperArmPos - handPos).normalized;
			Vector3 targetDir = shoulder.transform.rotation * (Vector3.up + (s.correctElbowOutside ? (armDirection + Vector3.forward * -.2) * elbowOutsideFactor : Vector3.zero));
			Vector3 cross = Vector3.Cross(shoulderHandDirection, targetDir * 1000);

			Vector3 upperArmUp = upperArmRotation * Vector3.up;

			float elbowTargetUp = Vector3.Dot(upperArmUp, targetDir);
			float elbowAngle = Vector3.Angle(cross, upperArmUp) + (left ? 0 : 180);
			Quaternion rotation = Quaternion.AngleAxis(elbowAngle * Mathf.Sign(elbowTargetUp), shoulderHandDirection);
			arm.upperArm.rotation = rotation * arm.upperArm.rotation;
		}

		/// <summary>
		/// reduces calculation problems when hand is moving around shoulder XZ coordinates -> forces elbow to be outside of body
		/// </summary>
		correctElbowAfterPositioning()
		{
			var s = elbowCorrectionSettings;
			Vector3 localTargetPos = shoulderAnker.InverseTransformPoint(target.position) / arm.armLength;
			Vector3 shoulderHandDirection = (upperArmPos - handPos).normalized;
			Vector3 elbowPos = s.localElbowPos;

			if (left)
				elbowPos.x *= -1;

			Vector3 targetDir = shoulder.transform.rotation * elbowPos.normalized;
			Vector3 cross = Vector3.Cross(shoulderHandDirection, targetDir);

			Vector3 upperArmUp = upperArmRotation * Vector3.up;


			Vector3 distance = target.position - upperArmPos;
			distance = distance.magnitude * shoulder.transform.InverseTransformDirection(distance / distance.magnitude);

			float weight = Mathf.Clamp01(Mathf.Clamp01((s.startBelowDistance - distance.xz().magnitude / arm.armLength) /
						   s.startBelowDistance) * s.weight + Mathf.Clamp01((-distance.z + .1) * 3)) *
						   Mathf.Clamp01((s.startBelowY - localTargetPos.y) /
										 s.startBelowY);

			float elbowTargetUp = Vector3.Dot(upperArmUp, targetDir);
			float elbowAngle2 = Vector3.Angle(cross, upperArmUp) + (left ? 0 : 180);
			Quaternion rotation = Quaternion.AngleAxis((elbowAngle2 * Mathf.Sign(elbowTargetUp)).toSignedEulerAngle() * Mathf.Clamp(weight, 0, 1), shoulderHandDirection);
			arm.upperArm.rotation = rotation * arm.upperArm.rotation;
		}

		rotateElbow(float angle)
		{
			Vector3 shoulderHandDirection = (upperArmPos - handPos).normalized;

			Quaternion rotation = Quaternion.AngleAxis(angle, shoulderHandDirection);
			setUpperArmRotation(rotation * upperArmRotation);
		}

		//source: https://github.com/NickHardeman/ofxIKArm/blob/master/src/ofxIKArm.cpp
		positionElbow()
		{
			float targetElbowAngle = getElbowTargetAngle();
			rotateElbow(targetElbowAngle);
		}


		rotateElbowWithHandRight()
		{
			var s = handSettings;
			Vector3 handUpVec = target.rotation * Vector3.up;
			float forwardAngle = VectorHelpers.getAngleBetween(lowerArmRotation * Vector3.right, target.rotation * Vector3.right,
				lowerArmRotation * Vector3.up, lowerArmRotation * Vector3.forward);

			// todo reduce influence if hand local forward rotation is high (hand tilted inside)
			Quaternion handForwardRotation = Quaternion.AngleAxis(-forwardAngle, lowerArmRotation * Vector3.forward);
			handUpVec = handForwardRotation * handUpVec;

			float elbowTargetAngle = VectorHelpers.getAngleBetween(lowerArmRotation * Vector3.up, handUpVec,
				lowerArmRotation * Vector3.forward, lowerArmRotation * armDirection);

			float deltaElbow = (elbowTargetAngle + (left ? -s.handDeltaOffset : s.handDeltaOffset)) / 180;

			deltaElbow = Mathf.Sign(deltaElbow) * Mathf.Pow(Mathf.Abs(deltaElbow), s.handDeltaPow) * 180 * s.handDeltaFactor;
			interpolatedDeltaElbow =
				Mathf.LerpAngle(interpolatedDeltaElbow, deltaElbow, Time.deltaTime / s.rotateElbowWithHandDelay);
			rotateElbow(interpolatedDeltaElbow);
		}

		rotateElbowWithHandFoward()
		{
			var s = handSettings;
			Vector3 handRightVec = target.rotation * armDirection;

			float elbowTargetAngleForward = VectorHelpers.getAngleBetween(lowerArmRotation * armDirection, handRightVec,
				lowerArmRotation * Vector3.up, lowerArmRotation * Vector3.forward);

			float deltaElbowForward = (elbowTargetAngleForward + (left ? -s.handDeltaForwardOffset : s.handDeltaForwardOffset)) / 180;

			if (Mathf.Abs(deltaElbowForward) < s.handDeltaForwardDeadzone)
				deltaElbowForward = 0;
			else
			{
				deltaElbowForward = (deltaElbowForward - Mathf.Sign(deltaElbowForward) * s.handDeltaForwardDeadzone) / (1 - s.handDeltaForwardDeadzone);
			}

			deltaElbowForward = Mathf.Sign(deltaElbowForward) * Mathf.Pow(Mathf.Abs(deltaElbowForward), s.handDeltaForwardPow) * 180;
			interpolatedDeltaElbowForward = Mathf.LerpAngle(interpolatedDeltaElbowForward, deltaElbowForward, Time.deltaTime / s.rotateElbowWithHandDelay);

			float signedInterpolated = interpolatedDeltaElbowForward.toSignedEulerAngle();
			rotateElbow(signedInterpolated * s.handDeltaForwardFactor);
		}

		rotateHand()
		{
			if (handSettings.useWristRotation)
			{
				Vector3 handUpVec = target.rotation * Vector3.up;
				float forwardAngle = VectorHelpers.getAngleBetween(lowerArmRotation * Vector3.right, target.rotation * Vector3.right,
					lowerArmRotation * Vector3.up, lowerArmRotation * Vector3.forward);

				// todo reduce influence if hand local forward rotation is high (hand tilted inside)
				Quaternion handForwardRotation = Quaternion.AngleAxis(-forwardAngle, lowerArmRotation * Vector3.forward);
				handUpVec = handForwardRotation * handUpVec;

				float elbowTargetAngle = VectorHelpers.getAngleBetween(lowerArmRotation * Vector3.up, handUpVec,
					lowerArmRotation * Vector3.forward, lowerArmRotation * armDirection);

				elbowTargetAngle = Mathf.Clamp(elbowTargetAngle, -90, 90);
				if (arm.wrist1 != null)
					setWrist1Rotation(Quaternion.AngleAxis(elbowTargetAngle * .3, lowerArmRotation * armDirection) * lowerArmRotation);
				if (arm.wrist2 != null)
					setWrist2Rotation(Quaternion.AngleAxis(elbowTargetAngle * .8, lowerArmRotation * armDirection) * lowerArmRotation);
			}
			setHandRotation(target.rotation);
		}

		removeShoulderRightRotation(Vector3 direction) {
			return Quaternion.AngleAxis(-shoulderPoser.shoulderRightRotation, shoulder.transform.right) * direction;
		}

		get armDirection() {
			return left ? Vector3.left : Vector3.right;
		}
		get upperArmPos() {
			return arm.upperArm.position;
		}
		get lowerArmPos() {
			return arm.lowerArm.position;
		}
		get handPos() {
			return arm.hand.position;
		}
		get shoulderAnker() {
			return left ? shoulder.leftShoulderAnchor : shoulder.rightShoulderAnchor;
		}

		get upperArmRotation() {
			return arm.upperArm.rotation * Quaternion.Inverse(upperArmStartRotation);
		}
		get lowerArmRotation() {
			return arm.lowerArm.rotation * Quaternion.Inverse(lowerArmStartRotation);
		}
		get handRotation() {
			return arm.hand.rotation * Quaternion.Inverse(handStartRotation);
		}

		setUpperArmRotation(Quaternion rotation) {
			return arm.upperArm.rotation = rotation * upperArmStartRotation;
		}
		setLowerArmRotation(Quaternion rotation) {
			return arm.lowerArm.rotation = rotation * lowerArmStartRotation;
		}
		setLowerArmLocalRotation(Quaternion rotation) {
			return arm.lowerArm.rotation = upperArmRotation * rotation * lowerArmStartRotation;
		}
		setWrist1Rotation(Quaternion rotation) {
			return arm.wrist1.rotation = rotation * wristStartRotation;
		}
		setWrist2Rotation(Quaternion rotation) {
			return arm.wrist2.rotation = rotation * wristStartRotation;
		}
		setWristLocalRotation(Quaternion rotation) {
			return arm.wrist1.rotation = arm.lowerArm.rotation * rotation * wristStartRotation;
    }
		setHandRotation(Quaternion rotation) {
			return arm.hand.rotation = arm.hand.rotation = rotation * handStartRotation;
		}
	}

export default VRArmIK;