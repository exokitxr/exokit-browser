class ArmTransforms
	{
		Transform upperArm, lowerArm, wrist1, wrist2, hand;

		float upperArmLength => distance(upperArm, lowerArm);
		float lowerArmLength => distance(lowerArm, hand);
		float armLength => upperArmLength + lowerArmLength;

		bool armLengthByScale = false;
		Vector3 scaleAxis = Vector3.one;
		float scaleHandFactor = .7f;

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
			var _armLength = (PoseManager.Instance.playerWidthWrist - shoulderWidth) / 2f;
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
			float upperArmFactor = .48f;
			if (armLengthByScale)
			{
				upperArm.localScale = upperArm.localScale / armLength * length;
				hand.localScale = Vector3.one / (1f - (1f - scaleHandFactor) * (1f - upperArm.localScale.x));
			}
			else
			{
				setUpperArmLength(length * upperArmFactor);
				setLowerArmLength(length * (1f - upperArmFactor));
			}
		}
	}