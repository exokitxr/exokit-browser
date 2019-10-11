import VRTrackingReferences from './VRTrackingReferences.js';

class PoseManager
	{
		constructor() {
			this.vrTransforms = new VRTrackingReferences();
		  this.OnCalibrateListener = null;

      // Oculus uses a different reference position -> 0 is the reference head position if the user is standing in the middle of the room. 
      // In OpenVR, the 0 position is the ground position and the user is then at (0, playerHeightHmd, 0) if he is in the middle of the room, so I need to correct this for shoulder calculation 
      this.vrSystemOffsetHeight = 0.0;

			this.referencePlayerHeightHmd = 1.7;
			this.referencePlayerWidthWrist = 1.39;
			this.playerHeightHmd = 1.70;
			this.playerWidthWrist = 1.39;
			this.playerWidthShoulders = 0.31;
      this.loadPlayerSizeOnAwake = false;
    }

		OnEnable()
		{
			if (Instance == null)
			{
				Instance = this;
			}
			else if (Instance != null)
			{
				Debug.LogError("Multiple Instances of PoseManager in Scene");
			}
		}

		Awake()
		{
            if (loadPlayerSizeOnAwake)
            {
                loadPlayerSize();
            }
            var device = XRSettings.loadedDeviceName;
            vrSystemOffsetHeight = string.IsNullOrEmpty(device) || device == "OpenVR" ? 0 : playerHeightHmd;
        }

		Start()
		{
			onCalibrate += OnCalibrate;
		}

		OnCalibrate()
		{
			playerHeightHmd = Camera.main.transform.position.y;
		}

		loadPlayerWidthShoulders()
		{
			playerWidthShoulders = PlayerPrefs.GetFloat("VRArmIK_PlayerWidthShoulders", 0.31);
		}

		savePlayerWidthShoulders(float width)
		{
			PlayerPrefs.SetFloat("VRArmIK_PlayerWidthShoulders", width);
		}

		calibrateIK()
		{
			playerWidthWrist = (vrTransforms.leftHand.position - vrTransforms.rightHand.position).magnitude;
			playerHeightHmd = vrTransforms.hmd.position.y;
			savePlayerSize(playerHeightHmd, playerWidthWrist);
		}

		savePlayerSize(float heightHmd, float widthWrist)
		{
			PlayerPrefs.SetFloat("VRArmIK_PlayerHeightHmd", heightHmd);
			PlayerPrefs.SetFloat("VRArmIK_PlayerWidthWrist", widthWrist);
			loadPlayerSize();
			onCalibrate?.Invoke();
		}

		loadPlayerSize()
		{
			playerHeightHmd = PlayerPrefs.GetFloat("VRArmIK_PlayerHeightHmd", referencePlayerHeightHmd);
			playerWidthWrist = PlayerPrefs.GetFloat("VRArmIK_PlayerWidthWrist", referencePlayerWidthWrist);
		}
	}
	PoseManager.Instance = null;

export default PoseManager;