import {Vector3} from './Unity.js';

import StaticOffsetTransform from './StaticOffsetTransform.js';

	class AvatarVRTrackingReferences
	{
		constructor() {
			this.head = new StaticOffsetTransform();
			this.hmd = new StaticOffsetTransform();
			this.leftHand = new StaticOffsetTransform();
			this.rightHand = new StaticOffsetTransform();
		}

		Start()
		{
			this.initTransforms();
		}

		initTransforms()
		{
			this.createTransforms();
			this.connectTransforms();
		}

		setStaticOffsetSettings(s)
		{
			s.referenceLocalPosition = false;
			s.referenceLocalRotation = false;
			s.applyLocalPosition = true;
			s.applyLocalRotation = true;
			s.applyPosition = true;
			s.applyRotation = true;
			s.applyForwardOffsetAfterRotationOffset = false;
		}


		createTransform(t, name)
		{
			if (t === null)
			{
				t = new GameObject(name).AddComponent<StaticOffsetTransform>();
				t.transform.parent = transform;
				this.setStaticOffsetSettings(t);
			}
		}

		/* createHandTransform(t, name, parent)
		{
			if (t === null)
			{
				t = new GameObject(name).transform;
				t.transform.localPosition = Vector3.zero;
				t.transform.parent = parent;
			}
		} */

		createTransforms()
		{
			this.createTransform(head, nameof(head));
			this.createTransform(leftHand, nameof(leftHand));
			this.createTransform(rightHand, nameof(rightHand));
			this.createTransform(hmd, nameof(hmd));
		}

		connectTransforms()
		{
			/*StaticOffsetTransform */const sot = this.GetOrAddComponent/*<StaticOffsetTransform>*/();
			if (sot.reference == null)
			{
				sot.reference = transform.parent;
			}

			this.head.reference = this.head.reference !== null ? this.head.reference : PoseManager.Instance.vrTransforms.head;
			this.hmd.reference = this.hmd.reference !== null ? this.hmd.reference : PoseManager.Instance.vrTransforms.hmd;
			this.leftHand.reference = leftHand.reference !== null
				? this.leftHand.reference
				: PoseManager.Instance.vrTransforms.leftHand;
			this.rightHand.reference = this.rightHand.reference !== null
				? this.rightHand.reference
				: PoseManager.Instance.vrTransforms.rightHand;
		}
	}

export default AvatarVRTrackingReferences;
