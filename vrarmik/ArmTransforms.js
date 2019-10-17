import {Vector3, Quaternion, Transform, MonoBehavior, Mathf} from './Unity.js';
import PoseManager from './PoseManager.js';

class ArmTransforms extends MonoBehavior
	{
		constructor(...args) {
      super(...args);

			this.upperArm = new Transform();
			this.upperArm.localPosition = new Vector3(-0.06732291289324821, -0.01723491704112179, -0.0009563277048525338);
			this.lowerArm = new Transform();
			this.lowerArm.localPosition = new Vector3(-0.1707330975901118, -0.1307657695972032, -0.0030010432725899837);
			this.wrist1 = new Transform();
			this.wrist2 = new Transform();
			this.hand = new Transform();
			this.hand.localPosition = new Vector3(-0.15051116024404965, -0.11438198726617288, 0.0031849598262429744);

      this.transform.AddChild(this.upperArm);
			this.upperArm.AddChild(this.lowerArm);
			// this.lowerArm.AddChild(this.wrist1);
			// this.lowerArm.AddChild(this.wrist2);
			this.lowerArm.AddChild(this.hand);

			this.armLengthByScale = false;
			this.scaleAxis = Vector3.one;
			this.scaleHandFactor = .7;
		}

		get upperArmLength() {
			return this.distance(this.upperArm, this.lowerArm);
		}
		get lowerArmLength() {
			return this.distance(this.lowerArm, this.hand);
		}
		get armLength() {
			return this.upperArmLength + this.lowerArmLength;
		}

		distance(a, b) {
			return a.position.distanceTo(b.position);
		}

	  Start()
		{
			// PoseManager.Instance.onCalibrate += this.updateArmLengths;
			// this.updateArmLengths();
		}

		updateArmLengths()
		{
			const shoulderWidth = new Vector3().subVectors(this.upperArm.position, this.lowerArm.position).magnitude;
			const _armLength = (PoseManager.Instance.playerWidthWrist - shoulderWidth) / 2;
			this.setArmLength(_armLength);
		}

		setUpperArmLength(length)
		{
			if (this.armLengthByScale)
			{
				const oldLowerArmLength = distance(this.lowerArm, this.hand);

				let newScale = new Vector3().subVectors(this.upperArm.localScale, this.scaleAxis.clone().multiplyScalar(Vector3.Scale(this.upperArm.localScale, this.scaleAxis).magnitude));
				const scaleFactor = Vector3.Scale(this.upperArm.localScale, this.scaleAxis).magnitude / upperArmLength * length;
				newScale += this.scaleAxis * scaleFactor;
				this.upperArm.localScale = newScale;

				this.setLowerArmLength(oldLowerArmLength);
			}
			else
			{
				const pos = this.lowerArm.localPosition;
				pos.x = Mathf.Sign(pos.x) * length;
				this.lowerArm.localPosition = pos;
			}
		}

		setLowerArmLength(length)
		{
			if (this.armLengthByScale)
			{
			}
			else
			{
				const pos = this.hand.localPosition;
				pos.x = Mathf.Sign(pos.x) * length;
				this.hand.localPosition = pos;
			}
		}

		setArmLength(length)
		{
			const upperArmFactor = .48;
			if (this.armLengthByScale)
			{
				this.upperArm.localScale = this.upperArm.localScale.clone().divideScalar(this.armLength).multiplyScalar(length);
				this.hand.localScale = Vector3.one.divideScalar(1 - (1 - this.scaleHandFactor) * (1 - this.upperArm.localScale.x));
			}
			else
			{
				this.setUpperArmLength(length * upperArmFactor);
				this.setLowerArmLength(length * (1 - upperArmFactor));
			}
		}
	}

export default ArmTransforms;
