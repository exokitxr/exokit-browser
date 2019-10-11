const EulerOrder = {
	XYZ: 'XYZ',
	XZY: 'XZY',
	YXZ: 'YXZ',
	YZX: 'YZX',
	ZXY: 'ZXY',
	ZYX: 'ZYX',
};

class StaticOffsetTransform
	{
		constructor() {
			this.reference = null;
			this.offsetPosition = new Vector3();
			this.offsetRotation = new Vector3();
			this.orientationalOffset = new Vector3();
			this.referenceRotationMultiplicator = Vector3.one;

			this.axisOrder = new EulerOrder();

			this.referenceLocalPosition = false;
			this.referenceLocalRotation = false;
			this.applyLocalPosition = false;
			this.applyLocalRotation = false;
			this.applyPosition = true;
			this.applyRotation = true;
			this.applyForwardOffsetAfterRotationOffset = false;
    }

		switchAxis(Vector3 r, EulerOrder order)
		{
			switch (order)
			{
				case EulerOrder.XYZ:
					return new Vector3(r.x, r.y, r.z);
				case EulerOrder.XZY:
					return new Vector3(r.x, r.z, r.y);
				case EulerOrder.YXZ:
					return new Vector3(r.y, r.x, r.z);
				case EulerOrder.YZX:
					return new Vector3(r.y, r.z, r.x);
				case EulerOrder.ZXY:
					return new Vector3(r.z, r.x, r.y);
				case EulerOrder.ZYX:
					return new Vector3(r.z, r.y, r.x);

				default:
					return r;
			}
		}

		Awake()
		{
			updatePosition();
		}

		Update()
		{
			updatePosition();
		}

		updatePosition()
		{
			if (reference == null)
				return;

			Vector3 rot = switchAxis(referenceLocalRotation ? reference.localEulerAngles : reference.eulerAngles, axisOrder) +
			              offsetRotation;
			rot.Scale(referenceRotationMultiplicator);

			Vector3 pos = referenceLocalPosition ? reference.localPosition : reference.position;


			if (applyForwardOffsetAfterRotationOffset)
			{
				pos += Quaternion.Euler(rot) * Vector3.right * orientationalOffset.x;
				pos += Quaternion.Euler(rot) * Vector3.up * orientationalOffset.y;
				pos += Quaternion.Euler(rot) * Vector3.forward * orientationalOffset.z;
			}
			else
			{
				pos += reference.right * orientationalOffset.x;
				pos += reference.up * orientationalOffset.y;
				pos += reference.forward * orientationalOffset.z;
			}

			pos += offsetPosition;

			if (applyPosition)
			{
				if (applyLocalPosition)
				{
					transform.localPosition = pos;
				}
				else
				{
					transform.position = pos;
				}
			}


			if (applyRotation)
			{
				if (applyLocalRotation)
				{
					transform.localEulerAngles = rot;
				}
				else
				{
					transform.eulerAngles = rot;
				}
			}
		}
	}

export default StaticOffsetTransform;