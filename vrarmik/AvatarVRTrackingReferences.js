import {Vector3, Transform} from './Unity.js';

import StaticOffsetTransform from './StaticOffsetTransform.js';

	class AvatarVRTrackingReferences
	{
		constructor(poseManager) {
      this.transform = new Transform();

			this.head = null;
			this.leftHand = null;
			this.rightHand = null;
			// this.hmd = null;

			this.poseManager = poseManager;

			this.initTransforms();
		}

		/* Awake()
		{
			this.initTransforms();

			this.head.Awake();
			this.leftHand.Awake();
			this.rightHand.Awake();
		} */

		Update() {
		  this.head.Update();
			this.leftHand.Update();
			this.rightHand.Update();
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
			const t = new StaticOffsetTransform();
			this.transform.AddChild(t.transform);
			this.setStaticOffsetSettings(t);
			this[k] = t;
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

			this.head.reference = this.poseManager.vrTransforms.head;
			// this.hmd.reference = this.hmd.reference !== null ? this.hmd.reference : this.poseManager.vrTransforms.hmd;
			this.leftHand.reference = this.poseManager.vrTransforms.leftHand;
			this.rightHand.reference = this.poseManager.vrTransforms.rightHand;
		}
	}

export default AvatarVRTrackingReferences;
