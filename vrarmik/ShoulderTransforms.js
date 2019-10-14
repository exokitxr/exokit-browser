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

			this.rightShoulder = new Transform();
			/* this.leftShoulderRenderer = new Transform();
			this.rightShoulderRenderer = new Transform(); */
			this.leftShoulderAnchor = new Transform();
			this.rightShoulderAnchor = new Transform();
			this.leftArm = null;
			this.rightArm = null;
		}

		Awake()
		{
			if (this.leftArm === null)
			{
				this.leftArm = new GameObject().AddComponent(ArmTransforms);
				const armIk = this.leftArm.GetComponentInChildren(VRArmIK);
				armIk.shoulder = this;
				armIk.shoulderPoser = this.GetComponent(ShoulderPoser);
				armIk.target = armIk.shoulderPoser.avatarTrackingReferences.leftHand.transform;
			}
			if (this.rightArm === null)
			{
				this.rightArm = new GameObject().AddComponent(ArmTransforms);
				const armIk = this.rightArm.GetComponentInChildren(VRArmIK);
				armIk.shoulder = this;
				armIk.shoulderPoser = this.GetComponent(ShoulderPoser);
				armIk.target = armIk.shoulderPoser.avatarTrackingReferences.rightHand.transform;
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
