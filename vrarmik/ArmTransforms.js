import Transform from './Transform.js';
import PoseManager from './PoseManager.js';

class ArmTransforms
	{
		constructor() {
			this.upperArm = new Transform();
			this.lowerArm = new Transform();
			this.wrist1 = new Transform();
			this.wrist2 = new Transform();
			this.hand = new Transform();

			this.armLengthByScale = false;
			this.scaleAxis = Vector3.one;
			this.scaleHandFactor = .7;
		}

		get upperArmLength() {
			return distance(this.upperArm, this.lowerArm);
		}
		get lowerArmLength() {
			return distance(this.lowerArm, this.hand);
		}
		get armLength() {
			return this.upperArmLength + this.lowerArmLength;
		}

		distance(a, b) {
			return (a.position - b.position).magnitude;
		}

	  Start()
		{
			PoseManager.Instance.onCalibrate += this.updateArmLengths;
			this.updateArmLengths();
		}

		updateArmLengths()
		{
			const shoulderWidth = (this.upperArm.position - this.lowerArm.position).magnitude;
			const _armLength = (PoseManager.Instance.playerWidthWrist - shoulderWidth) / 2;
			this.setArmLength(_armLength);
		}

		setUpperArmLength(length)
		{
			if (armLengthByScale)
			{
				const oldLowerArmLength = distance(this.lowerArm, this.hand);

				let newScale = this.upperArm.localScale - Vector3.Scale(this.upperArm.localScale, this.scaleAxis).magnitude * this.scaleAxis;
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
			if (armLengthByScale)
			{
				this.upperArm.localScale = this.upperArm.localScale / this.armLength * length;
				this.hand.localScale = Vector3.one / (1 - (1 - this.scaleHandFactor) * (1 - this.upperArm.localScale.x));
			}
			else
			{
				this.setUpperArmLength(length * upperArmFactor);
				this.setLowerArmLength(length * (1 - upperArmFactor));
			}
		}
	}

export default ArmTransforms;
