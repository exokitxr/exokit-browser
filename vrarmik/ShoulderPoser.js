class ShoulderPoser
	{
		ShoulderTransforms shoulder;
		VRTrackingReferences vrTrackingReferences;
		AvatarVRTrackingReferences avatarTrackingReferences;

		float headNeckDistance = 0.03f;
		Vector3 neckShoulderDistance = new Vector3(0f, -.1f, -0.02f);

		float maxDeltaHeadRotation = 80f;

		float distinctShoulderRotationLimitForward = 33f;

		float distinctShoulderRotationLimitBackward = 0f;

		float distinctShoulderRotationLimitUpward = 33f;
		float distinctShoulderRotationMultiplier = 30;

		float rightRotationStartHeight = 0f;
		float rightRotationHeightFactor = 142f;
		float rightRotationHeadRotationFactor = 0.3f;
		float rightRotationHeadRotationOffset = -20f;

		Vector3 headNeckDirectionVector = new Vector3(0f, -1f, -.05f);
		float startShoulderDislocationBefore = 0.005f;

		bool ignoreYPos = true;
		bool autoDetectHandsBehindHead = true;
		bool clampRotationToHead = true;
	  bool enableDistinctShoulderRotation = true;
		bool enableShoulderDislocation = true;


		bool handsBehindHead = false;

		bool clampingHeadRotation = false;
		bool shoulderDislocated = false;
		float shoulderRightRotation;


		Vector3 lastAngle = Vector3.zero;


		Vector3 leftShoulderAnkerStartLocalPosition, rightShoulderAnkerStartLocalPosition;

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
				leftShoulderAnkerStartLocalPosition, 1f);

		}

		rotateRightShoulder()
		{
			rotateShoulderUp(shoulder.rightShoulder, shoulder.rightArm, avatarTrackingReferences.rightHand.transform,
				rightShoulderAnkerStartLocalPosition, -1f);
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
			if (forwardDistanceRatio > 0f)
			{
				targetAngle.y = Mathf.Clamp((forwardDistanceRatio - 0.5f) * distinctShoulderRotationMultiplier, 0f,
					distinctShoulderRotationLimitForward);
			}
			else
			{
				targetAngle.y = Mathf.Clamp(-(forwardDistanceRatio + 0.08f) * distinctShoulderRotationMultiplier * 10f,
					-distinctShoulderRotationLimitBackward, 0f);
			}

			targetAngle.z = Mathf.Clamp(-(upwardDistanceRatio - 0.5f) * distinctShoulderRotationMultiplier,
				-distinctShoulderRotationLimitUpward, 0f);

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

			Vector3 targetRotation = new Vector3(0f, angle, 0f);

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
			float heightFactor = Mathf.Clamp(relativeHeightDiff - rightRotationStartHeight, 0f, 1f);
			shoulderRightRotation = heightFactor * rightRotationHeightFactor;
			shoulderRightRotation += Mathf.Clamp(headRightRotation * rightRotationHeadRotationFactor * heightFactor, 0f, 50f);

            shoulderRightRotation = Mathf.Clamp(shoulderRightRotation, 0f, 50f);

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

			return Mathf.Atan2(combinedDirection.x, combinedDirection.z) * 180f / Mathf.PI;
		}

		detectHandsBehindHead(ref Vector3 targetRotation)
		{
			float delta = Mathf.Abs(targetRotation.y - lastAngle.y + 360f) % 360f;
			if (delta > 150f && delta < 210f && lastAngle.magnitude > 0.000001f && !clampingHeadRotation)
			{
				handsBehindHead = !handsBehindHead;
			}

			lastAngle = targetRotation;

			if (handsBehindHead)
			{
				targetRotation.y += 180f;
			}
		}

		clampHeadRotationDeltaUp(ref Vector3 targetRotation)
		{
			float headUpRotation = (avatarTrackingReferences.head.transform.eulerAngles.y + 360f) % 360f;
			float targetUpRotation = (targetRotation.y + 360f) % 360f;

			float delta = headUpRotation - targetUpRotation;

			if (delta > maxDeltaHeadRotation && delta < 180f || delta < -180f && delta >= -360f + maxDeltaHeadRotation)
			{
				targetRotation.y = headUpRotation - maxDeltaHeadRotation;
				clampingHeadRotation = true;
			}
			else if (delta < -maxDeltaHeadRotation && delta > -180 || delta > 180f && delta < 360f - maxDeltaHeadRotation)
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

			float startBeforeFactor = (1f - startShoulderDislocationBefore);

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