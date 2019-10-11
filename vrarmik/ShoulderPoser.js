import ShoulderTransforms from './ShoulderTransforms.js';
import VRTrackingReferences from './VRTrackingReferences.js';

class ShoulderPoser
	{
		constructor() {
			this.shoulder = new ShoulderTransforms();
			this.vrTrackingReferences = new VRTrackingReferences();
			this.avatarTrackingReferences = AvatarVRTrackingReferences();

			this.headNeckDistance = 0.03;
			this.neckShoulderDistance = new Vector3(0, -.1, -0.02);

			this.maxDeltaHeadRotation = 80;

			this.distinctShoulderRotationLimitForward = 33;

			this.distinctShoulderRotationLimitBackward = 0;

			this.distinctShoulderRotationLimitUpward = 33;
			this.distinctShoulderRotationMultiplier = 30;

	  	this.rightRotationStartHeight = 0;
			this.rightRotationHeightFactor = 142;
			this.rightRotationHeadRotationFactor = 0.3;
			this.rightRotationHeadRotationOffset = -20;

			this.headNeckDirectionVector = new Vector3(0, -1, -.05);
			this.startShoulderDislocationBefore = 0.005;

			this.ignoreYPos = true;
		  this.autoDetectHandsBehindHead = true;
			this.clampRotationToHead = true;
		  this.enableDistinctShoulderRotation = true;
			this.enableShoulderDislocation = true;


			this.handsBehindHead = false;

			this.clampingHeadRotation = false;
			this.shoulderDislocated = false;
			this.shoulderRightRotation;


			this.lastAngle = Vector3.zero;


			this.leftShoulderAnkerStartLocalPosition = new Vector3();
			this.rightShoulderAnkerStartLocalPosition = new Vector3();
		}

		Start()
		{
			if (vrTrackingReferences == null)
				vrTrackingReferences = PoseManager.Instance.vrTransforms;

			leftShoulderAnkerStartLocalPosition = shoulder.transform.InverseTransformPoint(shoulder.leftShoulderAnchor.position);
			rightShoulderAnkerStartLocalPosition =
				shoulder.transform.InverseTransformPoint(shoulder.rightShoulderAnchor.position);
		}

		onCalibrate()
		{
			shoulder.leftArm.setArmLength((avatarTrackingReferences.leftHand.transform.position - shoulder.leftShoulderAnchor.position)
				.magnitude);
			shoulder.rightArm.setArmLength((avatarTrackingReferences.rightHand.transform.position - shoulder.rightShoulderAnchor.position)
				.magnitude);
		}

		Update()
		{
			shoulder.transform.rotation = Quaternion.identity;
			positionShoulder();
			rotateShoulderUp();
			rotateShoulderRight();

			if (enableDistinctShoulderRotation)
			{
				rotateLeftShoulder();
				rotateRightShoulder();
			}

			if (enableShoulderDislocation)
			{
				clampShoulderHandDistance();
			}
			else
			{
				shoulder.leftArm.transform.localPosition = Vector3.zero;
				shoulder.rightArm.transform.localPosition = Vector3.zero;
			}

			Debug.DrawRay(shoulder.transform.position, shoulder.transform.forward);
		}

		rotateLeftShoulder()
		{
			rotateShoulderUp(shoulder.leftShoulder, shoulder.leftArm, avatarTrackingReferences.leftHand.transform,
				leftShoulderAnkerStartLocalPosition, 1);

		}

		rotateRightShoulder()
		{
			rotateShoulderUp(shoulder.rightShoulder, shoulder.rightArm, avatarTrackingReferences.rightHand.transform,
				rightShoulderAnkerStartLocalPosition, -1);
		}

		rotateShoulderUp(Transform shoulderSide, ArmTransforms arm, Transform targetHand,
			Vector3 initialShoulderLocalPos, float angleSign)
		{
			Vector3 initialShoulderPos = shoulder.transform.TransformPoint(initialShoulderLocalPos);
			Vector3 handShoulderOffset = targetHand.position - initialShoulderPos;
			float armLength = arm.armLength;

			Vector3 targetAngle = Vector3.zero;

			float forwardDistanceRatio = Vector3.Dot(handShoulderOffset, shoulder.transform.forward) / armLength;
			float upwardDistanceRatio = Vector3.Dot(handShoulderOffset, shoulder.transform.up) / armLength;
			if (forwardDistanceRatio > 0)
			{
				targetAngle.y = Mathf.Clamp((forwardDistanceRatio - 0.5) * distinctShoulderRotationMultiplier, 0,
					distinctShoulderRotationLimitForward);
			}
			else
			{
				targetAngle.y = Mathf.Clamp(-(forwardDistanceRatio + 0.08) * distinctShoulderRotationMultiplier * 10,
					-distinctShoulderRotationLimitBackward, 0);
			}

			targetAngle.z = Mathf.Clamp(-(upwardDistanceRatio - 0.5) * distinctShoulderRotationMultiplier,
				-distinctShoulderRotationLimitUpward, 0);

			shoulderSide.localEulerAngles = targetAngle * angleSign;
		}


		positionShoulder()
		{
			Vector3 headNeckOffset = avatarTrackingReferences.hmd.transform.rotation * headNeckDirectionVector;
			Vector3 targetPosition = avatarTrackingReferences.head.transform.position + headNeckOffset * headNeckDistance;
			shoulder.transform.localPosition =
				shoulder.transform.parent.InverseTransformPoint(targetPosition) + neckShoulderDistance;
		}

		rotateShoulderUp()
		{
			float angle = getCombinedDirectionAngleUp();

			Vector3 targetRotation = new Vector3(0, angle, 0);

			if (autoDetectHandsBehindHead)
			{
				detectHandsBehindHead(ref targetRotation);
			}

			if (clampRotationToHead)
			{
				clampHeadRotationDeltaUp(ref targetRotation);
			}

			shoulder.transform.eulerAngles = targetRotation;
		}

		rotateShoulderRight()
		{
			float heightDiff = vrTrackingReferences.hmd.transform.position.y - PoseManager.Instance.vrSystemOffsetHeight;
			float relativeHeightDiff = -heightDiff / PoseManager.Instance.playerHeightHmd;

			float headRightRotation = VectorHelpers.getAngleBetween(shoulder.transform.forward,
										  avatarTrackingReferences.hmd.transform.forward,
										  Vector3.up, shoulder.transform.right) + rightRotationHeadRotationOffset;
			float heightFactor = Mathf.Clamp(relativeHeightDiff - rightRotationStartHeight, 0, 1);
			shoulderRightRotation = heightFactor * rightRotationHeightFactor;
			shoulderRightRotation += Mathf.Clamp(headRightRotation * rightRotationHeadRotationFactor * heightFactor, 0, 50);

            shoulderRightRotation = Mathf.Clamp(shoulderRightRotation, 0, 50);

			Quaternion deltaRot = Quaternion.AngleAxis(shoulderRightRotation, shoulder.transform.right);


			shoulder.transform.rotation = deltaRot * shoulder.transform.rotation;
			positionShoulderRelative();
		}

		positionShoulderRelative()
		{
			Quaternion deltaRot = Quaternion.AngleAxis(shoulderRightRotation, shoulder.transform.right);
			Vector3 shoulderHeadDiff = shoulder.transform.position - avatarTrackingReferences.head.transform.position;
			shoulder.transform.position = deltaRot * shoulderHeadDiff + avatarTrackingReferences.head.transform.position;
		}

		getCombinedDirectionAngleUp()
		{
			Transform leftHand = avatarTrackingReferences.leftHand.transform, rightHand = avatarTrackingReferences.rightHand.transform;

			Vector3 distanceLeftHand = leftHand.position - shoulder.transform.position,
				distanceRightHand = rightHand.position - shoulder.transform.position;

			if (ignoreYPos)
			{
				distanceLeftHand.y = 0;
				distanceRightHand.y = 0;
			}

			Vector3 directionLeftHand = distanceLeftHand.normalized,
				directionRightHand = distanceRightHand.normalized;

			Vector3 combinedDirection = directionLeftHand + directionRightHand;

			return Mathf.Atan2(combinedDirection.x, combinedDirection.z) * 180 / Mathf.PI;
		}

		detectHandsBehindHead(ref Vector3 targetRotation)
		{
			float delta = Mathf.Abs(targetRotation.y - lastAngle.y + 360) % 360;
			if (delta > 150 && delta < 210 && lastAngle.magnitude > 0.000001 && !clampingHeadRotation)
			{
				handsBehindHead = !handsBehindHead;
			}

			lastAngle = targetRotation;

			if (handsBehindHead)
			{
				targetRotation.y += 180;
			}
		}

		clampHeadRotationDeltaUp(ref Vector3 targetRotation)
		{
			float headUpRotation = (avatarTrackingReferences.head.transform.eulerAngles.y + 360) % 360;
			float targetUpRotation = (targetRotation.y + 360) % 360;

			float delta = headUpRotation - targetUpRotation;

			if (delta > maxDeltaHeadRotation && delta < 180 || delta < -180 && delta >= -360 + maxDeltaHeadRotation)
			{
				targetRotation.y = headUpRotation - maxDeltaHeadRotation;
				clampingHeadRotation = true;
			}
			else if (delta < -maxDeltaHeadRotation && delta > -180 || delta > 180 && delta < 360 - maxDeltaHeadRotation)
			{
				targetRotation.y = headUpRotation + maxDeltaHeadRotation;
				clampingHeadRotation = true;
			}
			else
			{
				clampingHeadRotation = false;
			}
		}

		clampShoulderHandDistance()
		{
			Vector3 leftHandVector = avatarTrackingReferences.leftHand.transform.position - shoulder.leftShoulderAnchor.position;
			Vector3 rightHandVector = avatarTrackingReferences.rightHand.transform.position - shoulder.rightShoulderAnchor.position;
			float leftShoulderHandDistance = leftHandVector.magnitude, rightShoulderHandDistance = rightHandVector.magnitude;
			shoulderDislocated = false;

			float startBeforeFactor = (1 - startShoulderDislocationBefore);

			if (leftShoulderHandDistance > shoulder.leftArm.armLength * startBeforeFactor)
			{
				shoulderDislocated = true;
				shoulder.leftArm.transform.position = shoulder.leftShoulderAnchor.position +
													  leftHandVector.normalized *
													  (leftShoulderHandDistance - shoulder.leftArm.armLength * startBeforeFactor);
			}
			else
			{
				shoulder.leftArm.transform.localPosition = Vector3.zero;
			}

			if (rightShoulderHandDistance > shoulder.rightArm.armLength * startBeforeFactor)
			{
				shoulderDislocated = true;
				shoulder.rightArm.transform.position = shoulder.rightShoulderAnchor.position +
													   rightHandVector.normalized *
													   (rightShoulderHandDistance -
														shoulder.rightArm.armLength * startBeforeFactor);
			}
			else
			{
				shoulder.rightArm.transform.localPosition = Vector3.zero;
			}
		}
	}

export default ShoulderPoser;