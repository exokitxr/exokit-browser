import {Vector3, Transform, GameObject, MonoBehavior} from './Unity.js';
import ArmTransforms from './ArmTransforms.js';
import ShoulderPoser from './ShoulderPoser.js';
import VRArmIK from './VRArmIK.js';
import PoseManager from './PoseManager.js';


class ShoulderTransforms extends MonoBehavior
	{
		constructor(...args) {
      super(...args);

			this.leftShoulder = new Transform();
			this.transform.AddChild(this.leftShoulder);

			this.rightShoulder = new Transform();
			this.transform.AddChild(this.rightShoulder);
			/* this.leftShoulderRenderer = new Transform();
			this.rightShoulderRenderer = new Transform(); */
			this.leftShoulderAnchor = new Transform();
			this.leftShoulderAnchor.localPosition = new Vector3(-0.3, 0, 0);
			this.transform.AddChild(this.leftShoulderAnchor);
			this.rightShoulderAnchor = new Transform();
			this.rightShoulderAnchor.localPosition = new Vector3(0.3, 0, 0);
			this.transform.AddChild(this.rightShoulderAnchor);
			this.leftArm = null;
			this.rightArm = null;
		}

		OnEnable()
		{
			const shoulderPoser = this.GetComponent(ShoulderPoser);
			if (this.leftArm === null)
			{
				this.leftArm = new GameObject().AddComponent(ArmTransforms);
				const armIk = this.leftArm.GetComponentInChildren(VRArmIK);
				armIk.shoulder = this;
				armIk.shoulderPoser = shoulderPoser;
				armIk.target = armIk.shoulderPoser.avatarTrackingReferences.leftHand.transform;
				this.leftShoulderAnchor.AddChild(this.leftArm.transform);
			}
			if (this.rightArm === null)
			{
				this.rightArm = new GameObject().AddComponent(ArmTransforms);
				const armIk = this.rightArm.GetComponentInChildren(VRArmIK);
				armIk.shoulder = this;
				armIk.shoulderPoser = shoulderPoser;
				armIk.target = armIk.shoulderPoser.avatarTrackingReferences.rightHand.transform;

				armIk.left = false;
        this.rightArm.lowerArm.localPosition = new Vector3(0.3, 0, 0);
        this.rightArm.hand.localPosition = new Vector3(0.3, 0, 0);
        this.rightShoulderAnchor.AddChild(this.rightArm.transform);
			}
		}

		/* Start()
		{
			this.setShoulderWidth(PoseManager.Instance.playerWidthShoulders);
		}

		setShoulderWidth(width)
		{
			const localScale = new Vector3(width * .5, .05, .05);
			const localPosition = new Vector3(width * .25, 0, 0);

			leftShoulderRenderer.localScale = localScale;
			leftShoulderRenderer.localPosition = localPosition.clone().multiplyScalar(-1);

			rightShoulderRenderer.localScale = localScale;
			rightShoulderRenderer.localPosition = localPosition;
		} */
	}

export default ShoulderTransforms;
