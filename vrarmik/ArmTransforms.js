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
			return distance(upperArm, lowerArm);
		}
		get lowerArmLength() {
			return distance(lowerArm, hand);
		}
		get armLength() {
			return upperArmLength + lowerArmLength;
		}

		distance(Transform a, Transform b) {
			return (a.position - b.position).magnitude;
		}

	  Start()
		{
			PoseManager.Instance.onCalibrate += updateArmLengths;
			updateArmLengths();
		}

		updateArmLengths()
		{
			var shoulderWidth = (upperArm.position - lowerArm.position).magnitude;
			var _armLength = (PoseManager.Instance.playerWidthWrist - shoulderWidth) / 2;
			setArmLength(_armLength);
		}

		setUpperArmLength(float length)
		{
			if (armLengthByScale)
			{
				float oldLowerArmLength = distance(lowerArm, hand);

				Vector3 newScale = upperArm.localScale - Vector3.Scale(upperArm.localScale, scaleAxis).magnitude * scaleAxis;
				float scaleFactor = Vector3.Scale(upperArm.localScale, scaleAxis).magnitude / upperArmLength * length;
				newScale += scaleAxis * scaleFactor;
				upperArm.localScale = newScale;

				setLowerArmLength(oldLowerArmLength);
			}
			else
			{
				Vector3 pos = lowerArm.localPosition;
				pos.x = Mathf.Sign(pos.x) * length;
				lowerArm.localPosition = pos;
			}
		}

		setLowerArmLength(float length)
		{
			if (armLengthByScale)
			{
			}
			else
			{
				Vector3 pos = hand.localPosition;
				pos.x = Mathf.Sign(pos.x) * length;
				hand.localPosition = pos;
			}
		}

		setArmLength(float length)
		{
			float upperArmFactor = .48;
			if (armLengthByScale)
			{
				upperArm.localScale = upperArm.localScale / armLength * length;
				hand.localScale = Vector3.one / (1 - (1 - scaleHandFactor) * (1 - upperArm.localScale.x));
			}
			else
			{
				setUpperArmLength(length * upperArmFactor);
				setLowerArmLength(length * (1 - upperArmFactor));
			}
		}
	}

export default ArmTransforms;