import {Vector3} from './Unity.js';

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

			this.axisOrder = EulerOrder.XYZ;

			this.referenceLocalPosition = false;
			this.referenceLocalRotation = false;
			this.applyLocalPosition = false;
			this.applyLocalRotation = false;
			this.applyPosition = true;
			this.applyRotation = true;
			this.applyForwardOffsetAfterRotationOffset = false;
    }

		switchAxis(r, order)
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
			this.updatePosition();
		}

		Update()
		{
			this.updatePosition();
		}

		updatePosition()
		{
			if (this.reference === null)
				return;

			const rot = this.switchAxis(this.referenceLocalRotation ? reference.localEulerAngles : reference.eulerAngles, this.axisOrder) +
			              this.offsetRotation;
			rot.Scale(referenceRotationMultiplicator);

			const pos = this.referenceLocalPosition ? this.reference.localPosition : this.reference.position;


			if (this.applyForwardOffsetAfterRotationOffset)
			{
				pos += Quaternion.Euler(rot) * Vector3.right * this.orientationalOffset.x;
				pos += Quaternion.Euler(rot) * Vector3.up * othis.rientationalOffset.y;
				pos += Quaternion.Euler(rot) * Vector3.forward * this.orientationalOffset.z;
			}
			else
			{
				pos += this.reference.right * this.orientationalOffset.x;
				pos += this.reference.up * this.orientationalOffset.y;
				pos += this.reference.forward * this.orientationalOffset.z;
			}

			pos += offsetPosition;

			if (this.applyPosition)
			{
				if (this.applyLocalPosition)
				{
					this.transform.localPosition = pos;
				}
				else
				{
					this.transform.position = pos;
				}
			}


			if (this.applyRotation)
			{
				if (this.applyLocalRotation)
				{
					this.transform.localEulerAngles = rot;
				}
				else
				{
					this.transform.eulerAngles = rot;
				}
			}
		}
	}

export default StaticOffsetTransform;
