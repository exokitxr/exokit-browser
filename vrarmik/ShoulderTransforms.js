import {Vector3, Transform} from './Unity.js';
import ArmTransforms from './ArmTransforms.js';
import ShoulderPoser from './ShoulderPoser.js';
import VRArmIK from './VRArmIK.js';


class ShoulderTransforms
	{
		constructor(rig) {
      this.transform = new Transform();
      this.hips = new Transform();
      this.spine = new Transform();
      this.neck = new Transform();
      this.head = new Transform();
      this.eyes = new Transform();

      this.hips.AddChild(this.spine);
      this.spine.AddChild(this.transform);
      this.transform.AddChild(this.neck);
      this.neck.AddChild(this.head);
      this.head.AddChild(this.eyes);

			this.leftShoulder = new Transform();
			this.transform.AddChild(this.leftShoulder);

			this.rightShoulder = new Transform();
			this.transform.AddChild(this.rightShoulder);
			this.leftShoulderAnchor = new Transform();
			this.transform.AddChild(this.leftShoulderAnchor);
			this.rightShoulderAnchor = new Transform();
			this.transform.AddChild(this.rightShoulderAnchor);

			this.leftArm = new ArmTransforms();
			this.rightArm = new ArmTransforms();

			this.leftShoulderAnchor.AddChild(this.leftArm.transform);
			this.rightShoulderAnchor.AddChild(this.rightArm.transform);

			this.shoulderPoser = new ShoulderPoser(rig, this);

			this.leftArmIk = new VRArmIK(this.leftArm, this, this.shoulderPoser, this.shoulderPoser.avatarTrackingReferences.leftHand, true);
			this.rightArmIk = new VRArmIK(this.rightArm, this, this.shoulderPoser, this.shoulderPoser.avatarTrackingReferences.rightHand, false);
		}

		Start()
		{
			this.leftArmIk.Start();
			this.rightArmIk.Start();
		}

		Update() {
			this.shoulderPoser.Update();
			this.leftArmIk.Update();
			this.rightArmIk.Update();
		}
	}

export default ShoulderTransforms;
