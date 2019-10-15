import {Vector3, Quaternion, Transform, GameObject, MonoBehavior, XRSettings} from './Unity.js';

class Leg extends MonoBehavior {
  constructor(...args) {
    super(...args);

    this.upperLeg = new Transform();
    this.upperLeg.localPosition = new Vector3(-0.2, 0, 0);
    this.lowerLeg = new Transform();
    this.lowerLeg.localPosition = new Vector3(0, -0.5, 0);
    this.foot = new Transform();

    this.transform.AddChild(this.upperLeg);
    this.upperLeg.AddChild(this.lowerLeg);
    this.lowerLeg.AddChild(this.foot);

    this.upperLegLength = this.upperLeg.position.distanceTo(this.lowerLeg.position);
    this.lowerLegLength = this.upperLeg.position.distanceTo(this.foot.position);

    this.left = true;
  }

  LateUpdate() {
    const legDistance = this.upperLeg.position.distanceTo(this.foot.position);
    if (legDistance < (this.upperLegLength + this.lowerLegLength)) {
      this.upperLeg.rotation = this.foot.rotation;

    	const hypotenuseDistance = this.upperLegLength;
      const verticalDistance = this.upperLeg.position.distanceTo(this.foot.position) / 2;
      const offsetDistance = Math.sqrt(hypotenuseDistance*hypotenuseDistance - verticalDistance*verticalDistance);
      const offsetDirection = this.foot.position.sub(this.upperLeg.position)
        .cross(new Vector3(1, 0, 0).applyQuaternion(this.foot.rotation))
        .normalize();

      this.lowerLeg.position = this.upperLeg.position.add(this.foot.position).divideScalar(2)
        .add(offsetDirection.clone().multiplyScalar(offsetDistance));
      this.lowerLeg.rotation = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), offsetDirection);
    } else {
      const direction = this.foot.position.sub(this.upperLeg.position).normalize();
      this.lowerLeg.position = this.upperLeg.position.add(direction.clone().multiplyScalar(this.upperLegLength));
      this.foot.position = this.lowerLeg.position.add(direction.clone().multiplyScalar(this.lowerLegLength));
    }

    // const angle = Math.asin(this.upperLeg.position.distanceTo(this.foot.position));
	}
}

class LegsManager extends MonoBehavior
{
	constructor(...args) {
    super(...args);

    this.hips = new Transform();
    this.leftLeg = new GameObject().AddComponent(Leg);
    this.hips.AddChild(this.leftLeg.transform);
    this.rightLeg = new GameObject().AddComponent(Leg);
    this.hips.AddChild(this.rightLeg.transform);

    console.log('upper left leg', this.leftLeg.upperLeg.localPosition.toArray().join(','), this.leftLeg.upperLeg.position.toArray().join(','));

    this.rightLeg.upperLeg.localPosition = new Vector3(0.2, 0, 0);
    this.rightLeg.left = false;
  }

	Start()
	{
		// XXX
	}

	LateUpdate() {

	}
}

export default LegsManager;
