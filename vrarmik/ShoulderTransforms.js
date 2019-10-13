import {Vector3, Transform} from './Unity.js';
import ArmTransforms from './ArmTransforms.js';

class ShoulderTransforms
	{
		constructor() {
			this.leftShoulder = new Transform();
			this.rightShoulder = new Transform();
			this.leftShoulderRenderer = new Transform();
			this.rightShoulderRenderer = new Transform();
			this.leftShoulderAnchor = Transform();
			this.rightShoulderAnchor = Transform();
		  this.leftArmDummy = new ArmTransforms();
		  this.rightArmDummy = new ArmTransforms();
			this.leftArm = new ArmTransforms();
			this.rightArm = new ArmTransforms();
		}

		Awake()
		{
			if (leftArm == null)
			{
				leftArm = Instantiate(leftArmDummy, leftShoulderAnchor.position, leftShoulderAnchor.rotation, leftShoulderAnchor);
				var armIk = leftArm.GetComponentInChildren<VRArmIK>();
				armIk.shoulder = this;
				armIk.shoulderPoser = GetComponent<ShoulderPoser>();
				armIk.target = armIk.shoulderPoser.avatarTrackingReferences.leftHand.transform;
			}
			if (rightArm == null)
			{
				rightArm = Instantiate(rightArmDummy, leftShoulderAnchor.position, rightShoulderAnchor.rotation, rightShoulderAnchor);
				var armIk = rightArm.GetComponentInChildren<VRArmIK>();
				armIk.shoulder = this;
				armIk.shoulderPoser = GetComponent<ShoulderPoser>();
				armIk.target = armIk.shoulderPoser.avatarTrackingReferences.rightHand.transform;
			}
		}

		Start()
		{
			setShoulderWidth(PoseManager.Instance.playerWidthShoulders);
		}

		setShoulderWidth(width)
		{
			const localScale = new Vector3(width * .5, .05, .05);
			const localPosition = new Vector3(width * .25, 0, 0);

			leftShoulderRenderer.localScale = localScale;
			leftShoulderRenderer.localPosition = -localPosition;

			rightShoulderRenderer.localScale = localScale;
			rightShoulderRenderer.localPosition = localPosition;
		}
	}

export default ShoulderTransforms;
