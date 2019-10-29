import {Vector3, GameObject, MonoBehavior} from './Unity.js';

import StaticOffsetTransform from './StaticOffsetTransform.js';

	class AvatarVRTrackingReferences extends MonoBehavior
	{
		constructor(transform, components, unity) {
      super(transform, components, unity);

			this.head = null;
			// this.hmd = null;
			this.leftHand = null;
			this.rightHand = null;

			this.unity = unity;
			this.poseManager = null;
		}

		Awake()
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


		createTransform(k)
		{
			let t = this[k];
			if (t === null)
			{
				t = this.unity.makeGameObject(name).AddComponent(StaticOffsetTransform);
				this.transform.AddChild(t.transform);
				this.setStaticOffsetSettings(t);
				this[k] = t;
			}
		}

		/* createHandTransform(t, name, parent)
		{
			if (t === null)
			{
				t = this.unity.makeGameObject(name).transform;
				t.transform.localPosition = Vector3.zero;
				this.transform.AddChild(t.transform);
			}
		} */

		createTransforms()
		{
			this.createTransform('head');
			this.createTransform('leftHand');
			this.createTransform('rightHand');
			// this.createTransform('hmd');
		}

		connectTransforms()
		{
			/* const sot = this.GetOrAddComponent(StaticOffsetTransform);
			if (sot.reference === null)
			{
				sot.reference = this.transform.parent;
			} */

			this.head.reference = this.head.reference !== null ? this.head.reference : this.poseManager.vrTransforms.head;
			// this.hmd.reference = this.hmd.reference !== null ? this.hmd.reference : this.poseManager.vrTransforms.hmd;
			this.leftHand.reference = this.leftHand.reference !== null ? this.leftHand.reference : this.poseManager.vrTransforms.leftHand;
			this.rightHand.reference = this.rightHand.reference !== null ? this.rightHand.reference : this.poseManager.vrTransforms.rightHand;
		}
	}

export default AvatarVRTrackingReferences;
