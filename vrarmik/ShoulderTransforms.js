import {Vector3, Transform, MonoBehavior} from './Unity.js';
import ArmTransforms from './ArmTransforms.js';
import ShoulderPoser from './ShoulderPoser.js';

function Instantiate() {
  // XXX	
}

class ShoulderTransforms extends MonoBehavior
	{
		constructor(transform) {
      constructor(transform);

			this.leftShoulder = new Transform();
			this.rightShoulder = new Transform();
			this.leftShoulderRenderer = new Transform();
			this.rightShoulderRenderer = new Transform();
			this.leftShoulderAnchor = Transform();
			this.rightShoulderAnchor = Transform();
			this.leftArm = null;
			this.rightArm = null;
		}

		Awake()
		{
			if (leftArm == null)
			{
				this.leftArm = new ArmTransforms();
				const armIk = leftArm.GetComponentInChildren(VRArmIK);
				armIk.shoulder = this;
				armIk.shoulderPoser = this.GetComponent(ShoulderPoser);
				armIk.target = armIk.shoulderPoser.avatarTrackingReferences.leftHand.transform;
			}
			if (rightArm == null)
			{
				this.rightArm = new ArmTransforms();
				const armIk = rightArm.GetComponentInChildren(VRArmIK);
				armIk.shoulder = this;
				armIk.shoulderPoser = this.GetComponent(ShoulderPoser);
				armIk.target = armIk.shoulderPoser.avatarTrackingReferences.rightHand.transform;
			}
		}

		Start()
		{
			this.setShoulderWidth(PoseManager.Instance.playerWidthShoulders);
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
