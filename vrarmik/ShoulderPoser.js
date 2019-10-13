import {Vector3, Quaternion, MonoBehavior} from './Unity.js';
import ShoulderTransforms from './ShoulderTransforms.js';
import VRTrackingReferences from './VRTrackingReferences.js';
import AvatarVRTrackingReferences from './AvatarVRTrackingReferences.js';
import PoseManager from './PoseManager.js';

class ShoulderPoser extends MonoBehavior
	{
		constructor(transform) {
      super(transform);

			this.shoulder = new ShoulderTransforms();
			this.vrTrackingReferences = new VRTrackingReferences();
			this.avatarTrackingReferences = new AvatarVRTrackingReferences();

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
			if (this.vrTrackingReferences === null)
				this.vrTrackingReferences = PoseManager.Instance.vrTransforms;

			this.leftShoulderAnkerStartLocalPosition = this.shoulder.transform.InverseTransformPoint(this.shoulder.leftShoulderAnchor.position);
			this.rightShoulderAnkerStartLocalPosition =
				this.shoulder.transform.InverseTransformPoint(this.shoulder.rightShoulderAnchor.position);
		}

		onCalibrate()
		{
			this.shoulder.leftArm.setArmLength((avatarTrackingReferences.leftHand.transform.position - this.shoulder.leftShoulderAnchor.position)
				.magnitude);
			this.shoulder.rightArm.setArmLength((avatarTrackingReferences.rightHand.transform.position - this.shoulder.rightShoulderAnchor.position)
				.magnitude);
		}

		Update()
		{
			this.shoulder.transform.rotation = Quaternion.identity;
			this.positionShoulder();
			this.rotateShoulderUp();
			this.rotateShoulderRight();

			if (this.enableDistinctShoulderRotation)
			{
				this.rotateLeftShoulder();
				this.rotateRightShoulder();
			}

			if (this.enableShoulderDislocation)
			{
				this.clampShoulderHandDistance();
			}
			else
			{
				this.shoulder.leftArm.transform.localPosition = Vector3.zero;
				this.shoulder.rightArm.transform.localPosition = Vector3.zero;
			}

			// Debug.DrawRay(this.shoulder.transform.position, this.shoulder.transform.forward);
		}

		rotateLeftShoulder()
		{
			this.rotateShoulderUp(shoulder.leftShoulder, this.shoulder.leftArm, this.avatarTrackingReferences.leftHand.transform,
				this.leftShoulderAnkerStartLocalPosition, 1);

		}

		rotateRightShoulder()
		{
			this.rotateShoulderUp(shoulder.rightShoulder, this.shoulder.rightArm, this.avatarTrackingReferences.rightHand.transform,
				this.rightShoulderAnkerStartLocalPosition, -1);
		}

		rotateShoulderUp(shoulderSide, arm, targetHand,
			initialShoulderLocalPos, angleSign)
		{
			const initialShoulderPos = this.shoulder.transform.TransformPoint(initialShoulderLocalPos);
			const handShoulderOffset = targetHand.position - this.initialShoulderPos;
			const armLength = arm.armLength;

			const targetAngle = Vector3.zero;

		  const forwardDistanceRatio = Vector3.Dot(handShoulderOffset, this.shoulder.transform.forward) / armLength;
			const upwardDistanceRatio = Vector3.Dot(handShoulderOffset, this.shoulder.transform.up) / armLength;
			if (forwardDistanceRatio > 0)
			{
				targetAngle.y = Mathf.Clamp((forwardDistanceRatio - 0.5) * this.distinctShoulderRotationMultiplier, 0,
					this.distinctShoulderRotationLimitForward);
			}
			else
			{
				targetAngle.y = Mathf.Clamp(-(forwardDistanceRatio + 0.08) * this.distinctShoulderRotationMultiplier * 10,
					-this.distinctShoulderRotationLimitBackward, 0);
			}

			targetAngle.z = Mathf.Clamp(-(upwardDistanceRatio - 0.5) * distinctShoulderRotationMultiplier,
				-distinctShoulderRotationLimitUpward, 0);

			shoulderSide.localEulerAngles = targetAngle * angleSign;
		}


		positionShoulder()
		{
			const headNeckOffset = this.avatarTrackingReferences.hmd.transform.rotation * this.headNeckDirectionVector;
			const targetPosition = this.avatarTrackingReferences.head.transform.position + headNeckOffset * this.headNeckDistance;
			this.shoulder.transform.localPosition =
				this.shoulder.transform.parent.InverseTransformPoint(targetPosition) + this.neckShoulderDistance;
		}

		rotateShoulderUp()
		{
			const angle = getCombinedDirectionAngleUp();

			const targetRotation = new Vector3(0, angle, 0);

			if (this.autoDetectHandsBehindHead)
			{
				this.detectHandsBehindHead(targetRotation);
			}

			if (this.clampRotationToHead)
			{
				this.clampHeadRotationDeltaUp(targetRotation);
			}

			shouldthis.er.transform.eulerAngles = targetRotation;
		}

		rotateShoulderRight()
		{
			const heightDiff = this.vrTrackingReferences.hmd.transform.position.y - PoseManager.Instance.vrSystemOffsetHeight;
			const relativeHeightDiff = -heightDiff / PoseManager.Instance.playerHeightHmd;

			const headRightRotation = VectorHelpers.getAngleBetween(this.shoulder.transform.forward,
										  this.avatarTrackingReferences.hmd.transform.forward,
										  Vector3.up, this.shoulder.transform.right) + this.rightRotationHeadRotationOffset;
			const heightFactor = Mathf.Clamp(relativeHeightDiff - this.rightRotationStartHeight, 0, 1);
			this.shoulderRightRotation = heightFactor * this.rightRotationHeightFactor;
			this.shoulderRightRotation += Mathf.Clamp(headRightRotation * this.rightRotationHeadRotationFactor * heightFactor, 0, 50);

            this.shoulderRightRotation = Mathf.Clamp(this.shoulderRightRotation, 0, 50);

			const deltaRot = Quaternion.AngleAxis(this.shoulderRightRotation, this.shoulder.transform.right);


			this.shoulder.transform.rotation = deltaRot * this.shoulder.transform.rotation;
			this.positionShoulderRelative();
		}

		positionShoulderRelative()
		{
			const deltaRot = Quaternion.AngleAxis(this.shoulderRightRotation, this.shoulder.transform.right);
			const shoulderHeadDiff = this.shoulder.transform.position - this.avatarTrackingReferences.head.transform.position;
			this.shoulder.transform.position = deltaRot * shoulderHeadDiff + this.avatarTrackingReferences.head.transform.position;
		}

		getCombinedDirectionAngleUp()
		{
			const leftHand = this.avatarTrackingReferences.leftHand.transform;
      const rightHand = this.avatarTrackingReferences.rightHand.transform;

			const distanceLeftHand = leftHand.position - this.shoulder.transform.position;
			const distanceRightHand = rightHand.position - this.shoulder.transform.position;

			if (this.ignoreYPos)
			{
				this.distanceLeftHand.y = 0;
				this.distanceRightHand.y = 0;
			}

			const directionLeftHand = distanceLeftHand.normalized;
			const directionRightHand = distanceRightHand.normalized;

			const combinedDirection = directionLeftHand + directionRightHand;

			return Mathf.Atan2(combinedDirection.x, combinedDirection.z) * 180 / Mathf.PI;
		}

		detectHandsBehindHead(targetRotation)
		{
			const delta = Mathf.Abs(targetRotation.y - this.lastAngle.y + 360) % 360;
			if (delta > 150 && delta < 210 && this.lastAngle.magnitude > 0.000001 && !clampingHeadRotation)
			{
				this.handsBehindHead = !this.handsBehindHead;
			}

			this.lastAngle = targetRotation;

			if (this.handsBehindHead)
			{
				targetRotation.y += 180;
			}
		}

		clampHeadRotationDeltaUp(targetRotation)
		{
			const headUpRotation = (this.avatarTrackingReferences.head.transform.eulerAngles.y + 360) % 360;
			const targetUpRotation = (targetRotation.y + 360) % 360;

			const delta = headUpRotation - targetUpRotation;

			if (delta > this.maxDeltaHeadRotation && delta < 180 || delta < -180 && delta >= -360 + this.maxDeltaHeadRotation)
			{
				targetRotation.y = headUpRotation - this.maxDeltaHeadRotation;
				this.clampingHeadRotation = true;
			}
			else if (delta < -this.maxDeltaHeadRotation && delta > -180 || delta > 180 && delta < 360 - this.maxDeltaHeadRotation)
			{
				targetRotation.y = headUpRotation + this.maxDeltaHeadRotation;
				this.clampingHeadRotation = true;
			}
			else
			{
				this.clampingHeadRotation = false;
			}
		}

		clampShoulderHandDistance()
		{
			const leftHandVector = this.avatarTrackingReferences.leftHand.transform.position - this.shoulder.leftShoulderAnchor.position;
			const rightHandVector = this.avatarTrackingReferences.rightHand.transform.position - this.shoulder.rightShoulderAnchor.position;
			const leftShoulderHandDistance = leftHandVector.magnitude;
      const rightShoulderHandDistance = rightHandVector.magnitude;
			this.shoulderDislocated = false;

		  const startBeforeFactor = (1 - this.startShoulderDislocationBefore);

			if (leftShoulderHandDistance > this.shoulder.leftArm.armLength * startBeforeFactor)
			{
				this.shoulderDislocated = true;
				this.shoulder.leftArm.transform.position = this.shoulder.leftShoulderAnchor.position +
													  leftHandVector.normalized *
													  (leftShoulderHandDistance - this.shoulder.leftArm.armLength * startBeforeFactor);
			}
			else
			{
				this.shoulder.leftArm.transform.localPosition = Vector3.zero;
			}

			if (rightShoulderHandDistance > this.shoulder.rightArm.armLength * this.startBeforeFactor)
			{
				this.shoulderDislocated = true;
				this.shoulder.rightArm.transform.position = this.shoulder.rightShoulderAnchor.position +
													   rightHandVector.normalized *
													   (rightShoulderHandDistance -
														this.shoulder.rightArm.armLength * startBeforeFactor);
			}
			else
			{
				this.shoulder.rightArm.transform.localPosition = Vector3.zero;
			}
		}
	}

export default ShoulderPoser;
