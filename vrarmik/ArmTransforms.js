import {Vector3, Quaternion, Transform, Mathf} from './Unity.js';

class ArmTransforms
	{
		constructor() {
      this.transform = new Transform();
			this.upperArm = new Transform();
			this.lowerArm = new Transform();
			this.hand = new Transform();

      this.transform.AddChild(this.upperArm);
			this.upperArm.AddChild(this.lowerArm);
			this.lowerArm.AddChild(this.hand);
		}
	}

export default ArmTransforms;
