import {Transform, MonoBehavior} from './Unity.js';

  class VRTrackingReferences extends MonoBehavior
	{
    constructor(transform) {
      super(transform);

      this.leftController = new Transform();
      this.rightController = new Transform();
      this.hmd = new Transform();
      this.leftHand = new Transform();
      this.rightHand = new Transform();
      this.head = new Transform();
    }
	}

export default VRTrackingReferences;
