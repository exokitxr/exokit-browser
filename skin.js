window.skin = (() => {

const scale = 1 / 18;
const offsetY = 22 + 13.5/2 - 8/2;
const rotationOrder = 'YXZ';
const esp = 0.002;

function toFaceVertices(x1, y1, x2, y2, w, h) {
	return [
		new THREE.Vector2(x1 / w, 1.0 - y2 / h),
		new THREE.Vector2(x2 / w, 1.0 - y2 / h),
		new THREE.Vector2(x2 / w, 1.0 - y1 / h),
		new THREE.Vector2(x1 / w, 1.0 - y1 / h)
	];
}

function toSkinVertices(x1, y1, x2, y2) {
	return toFaceVertices(x1, y1, x2, y2, 64.0, 64.0);
}

function setVertices(box, top, bottom, left, front, right, back) {
	box.faceVertexUvs[0] = [];
	box.faceVertexUvs[0][0] = [right[3], right[0], right[2]];
	box.faceVertexUvs[0][1] = [right[0], right[1], right[2]];
	box.faceVertexUvs[0][2] = [left[3], left[0], left[2]];
	box.faceVertexUvs[0][3] = [left[0], left[1], left[2]];
	box.faceVertexUvs[0][4] = [top[3], top[0], top[2]];
	box.faceVertexUvs[0][5] = [top[0], top[1], top[2]];
	box.faceVertexUvs[0][6] = [bottom[0], bottom[3], bottom[1]];
	box.faceVertexUvs[0][7] = [bottom[3], bottom[2], bottom[1]];
	box.faceVertexUvs[0][8] = [front[3], front[0], front[2]];
	box.faceVertexUvs[0][9] = [front[0], front[1], front[2]];
	box.faceVertexUvs[0][10] = [back[3], back[0], back[2]];
	box.faceVertexUvs[0][11] = [back[0], back[1], back[2]];
}

const SKIN_SHADER = {
  uniforms: {
    headRotation: {
      type: 'v4',
      value: new THREE.Vector4(),
    },
    leftArmRotation: {
      type: 'v4',
      value: new THREE.Vector4(),
    },
    rightArmRotation: {
      type: 'v4',
      value: new THREE.Vector4(),
    },
    theta: {
      type: 'f',
      value: 0,
    },
    headVisible: {
      type: 'f',
      value: 1,
    },
    hit: {
      type: 'f',
      value: 0,
    },
    map: {
      type: 't',
      value: null,
    },
  },
  vertexShader: [
    "uniform vec4 headRotation;",
    "uniform vec4 leftArmRotation;",
    "uniform vec4 rightArmRotation;",
    "uniform float theta;",
    "uniform float headVisible;",
    "attribute vec4 dh;",
    "attribute vec4 dl;",
    "attribute vec4 dr;",
    "attribute vec4 dy;",
    "varying vec2 vUv;",
`
vec3 applyQuaternion(vec3 vec, vec4 quat) {
return vec + 2.0 * cross( cross( vec, quat.xyz ) + quat.w * vec, quat.xyz );
}
`,
    "void main() {",
    "  float theta2 = theta * dy.w;",
    "  vec3 headPosition = dh.w > 0.0 ? (headVisible > 0.0 ?(applyQuaternion(position.xyz - dh.xyz, headRotation) + dh.xyz) : vec3(0.0)) : position.xyz;",
    "  vec3 limbPosition = vec3(headPosition.x, headPosition.y - dy.y + (dy.y*cos(theta2) - dy.z*sin(theta2)), headPosition.z + dy.z + (dy.z*cos(theta2) + dy.y*sin(theta2)));",
    "  vec3 leftArmPosition = dl.w > 0.0 ? applyQuaternion(limbPosition.xyz - dl.xyz, leftArmRotation) + dl.xyz : limbPosition.xyz;",
    "  vec3 rightArmPosition = dr.w > 0.0 ? applyQuaternion(leftArmPosition.xyz - dr.xyz, rightArmRotation) + dr.xyz : leftArmPosition.xyz;",
    "  gl_Position = projectionMatrix * modelViewMatrix * vec4(rightArmPosition, 1.0);",
    "  vUv = uv;",
    "}"
  ].join("\n"),
  fragmentShader: [
    "uniform float hit;",
    "uniform sampler2D map;",
    "varying vec2 vUv;",
    "void main() {",
    "  vec4 diffuseColor = texture2D(map, vUv);",
    "  if (diffuseColor.a < 0.5) {",
    "    discard;",
    "  }",
    "  if (hit > 0.5) {",
    "    diffuseColor.r += 0.3;",
    "  }",
    "  gl_FragColor = diffuseColor;",
    "}"
  ].join("\n")
};
const skinSize = new THREE.Vector3(1, 2, 1);

const headBox = (() => {
  const headBox = new THREE.BoxGeometry(8, 8, 8, 0, 0, 0);
  setVertices(headBox,
    toSkinVertices(8, 0, 16, 8),
    toSkinVertices(16, 0, 24, 8),
    toSkinVertices(0, 8, 8, 16),
    toSkinVertices(8, 8, 16, 16),
    toSkinVertices(16, 8, 24, 16),
    toSkinVertices(24, 8, 32, 16)
  );
  const geometry = new THREE.BufferGeometry().fromGeometry(headBox);
  const dhs = (() => {
    const positions = geometry.getAttribute('position').array;
    const numPositions = positions.length / 3;
    const result = new Float32Array(numPositions * 4);

    for (let i = 0; i < numPositions; i++) {
      const baseIndex = i * 4;
      result[baseIndex + 0] = 0;
      result[baseIndex + 1] = offsetY;
      result[baseIndex + 2] = 0;
      result[baseIndex + 3] = 1;
    }

    return result;
  })();
  geometry.addAttribute('dh', new THREE.BufferAttribute(dhs), 4);
  geometry.addAttribute('dl', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.addAttribute('dr', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.addAttribute('dy', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, offsetY, 0));
  return geometry;
})();

const head2Box = (() => {
  const head2Box = new THREE.BoxGeometry(9, 9, 9, 0, 0, 0);
  setVertices(head2Box,
    toSkinVertices(40, 0, 48, 8),
    toSkinVertices(48, 0, 56, 8),
    toSkinVertices(32, 8, 40, 16),
    toSkinVertices(40, 8, 48, 16),
    toSkinVertices(48, 8, 56, 16),
    toSkinVertices(56, 8, 64, 16)
  );
  const geometry = new THREE.BufferGeometry().fromGeometry(head2Box);
  const dhs = (() => {
    const positions = geometry.getAttribute('position').array;
    const numPositions = positions.length / 3;
    const result = new Float32Array(numPositions * 4);

    for (let i = 0; i < numPositions; i++) {
      const baseIndex = i * 4;
      result[baseIndex + 0] = 0;
      result[baseIndex + 1] = offsetY;
      result[baseIndex + 2] = 0;
      result[baseIndex + 3] = 1;
    }

    return result;
  })();
  geometry.addAttribute('dh', new THREE.BufferAttribute(dhs), 4);
  geometry.addAttribute('dl', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.addAttribute('dr', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.addAttribute('dy', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, offsetY, 0));
  return geometry;
})();

const bodyBox = (() => {
  const bodyBox = new THREE.BoxGeometry(8, 12, 4, 0, 0, 0);
  setVertices(bodyBox,
    toSkinVertices(20, 16, 28, 20),
    toSkinVertices(28, 16, 36, 20),
    toSkinVertices(16, 20, 20, 32),
    toSkinVertices(20, 20, 28, 32),
    toSkinVertices(28, 20, 32, 32),
    toSkinVertices(32, 20, 40, 32)
  );
  const geometry = new THREE.BufferGeometry().fromGeometry(bodyBox)
    .applyMatrix(new THREE.Matrix4().makeTranslation(0, -10 + offsetY, 0));
  geometry.addAttribute('dh', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.addAttribute('dl', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.addAttribute('dr', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.addAttribute('dy', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  return geometry;
})();

const body2Box = (() => {
  const body2Box = new THREE.BoxGeometry(9, 13.5, 4.5, 0, 0, 0);
  setVertices(body2Box,
    toSkinVertices(20, 32, 28, 36),
    toSkinVertices(28, 32, 36, 36),
    toSkinVertices(16, 36, 20, 48),
    toSkinVertices(20, 36, 28, 48),
    toSkinVertices(28, 36, 32, 48),
    toSkinVertices(32, 36, 40, 48)
  );
  const geometry = new THREE.BufferGeometry().fromGeometry(body2Box)
    .applyMatrix(new THREE.Matrix4().makeTranslation(0, -10 + offsetY, 0));
  geometry.addAttribute('dh', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.addAttribute('dl', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.addAttribute('dr', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.addAttribute('dy', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  return geometry;
})();

const rightArmBox = (() => {
  const rightArmBox = new THREE.BoxGeometry(3, 12 - esp, 4 - esp, 0, 0, 0);
  setVertices(rightArmBox,
    toSkinVertices(44, 16, 47, 20),
    toSkinVertices(47, 16, 50, 20),
    toSkinVertices(40, 20, 44, 32),
    toSkinVertices(44, 20, 47, 32),
    toSkinVertices(47, 20, 51, 32),
    toSkinVertices(51, 20, 54, 32)
  );
  const geometry = new THREE.BufferGeometry().fromGeometry(rightArmBox)
    .applyMatrix(new THREE.Matrix4().makeTranslation(0, -12/2, 0));
  const offset = new THREE.Vector3(-6, -10 + 12/2 + offsetY, 0);
  const drs = (() => {
    const positions = geometry.getAttribute('position').array;
    const numPositions = positions.length / 3;
    const result = new Float32Array(numPositions * 4);

    for (let i = 0; i < numPositions; i++) {
      const baseIndex = i * 4;
      result[baseIndex + 0] = -offset.x;
      result[baseIndex + 1] = offset.y;
      result[baseIndex + 2] = offset.z;
      result[baseIndex + 3] = 1;
    }

    return result;
  })();
  const dys = (() => {
    const positions = geometry.getAttribute('position').array;
    const numPositions = positions.length / 3;
    const result = new Float32Array(numPositions * 4);

    for (let i = 0; i < numPositions; i++) {
      const baseIndex = i * 4;
      const basePositionIndex = i * 3;
      result[baseIndex + 0] = positions[basePositionIndex + 0];
      result[baseIndex + 1] = positions[basePositionIndex + 1];
      result[baseIndex + 2] = positions[basePositionIndex + 2];
      // result[baseIndex + 3] = 1; // angle factor
      result[baseIndex + 3] = 0;
    }

    return result;
  })();
  geometry.addAttribute('dh', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.addAttribute('dl', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.addAttribute('dr', new THREE.BufferAttribute(drs, 4));
  geometry.addAttribute('dy', new THREE.BufferAttribute(dys, 4));
  geometry.applyMatrix(new THREE.Matrix4().makeTranslation(offset.x, offset.y, offset.z));
  return geometry;
})();

const rightArm2Box = (() => {
  const rightArm2Box = new THREE.BoxGeometry(3.375, 13.5 - esp, 4.5 - esp, 0, 0, 0);
  setVertices(rightArm2Box,
    toSkinVertices(44, 32, 47, 36),
    toSkinVertices(47, 32, 50, 36),
    toSkinVertices(40, 36, 44, 48),
    toSkinVertices(44, 36, 47, 48),
    toSkinVertices(47, 36, 51, 48),
    toSkinVertices(51, 36, 54, 48)
  );
  const geometry = new THREE.BufferGeometry().fromGeometry(rightArm2Box)
    .applyMatrix(new THREE.Matrix4().makeTranslation(0, -12/2, 0));
  const offset = new THREE.Vector3(-6, -10 + offsetY + 12/2, 0);
  const drs = (() => {
    const positions = geometry.getAttribute('position').array;
    const numPositions = positions.length / 3;
    const result = new Float32Array(numPositions * 4);

    for (let i = 0; i < numPositions; i++) {
      const baseIndex = i * 4;
      result[baseIndex + 0] = -offset.x;
      result[baseIndex + 1] = offset.y;
      result[baseIndex + 2] = offset.z;
      result[baseIndex + 3] = 1;
    }

    return result;
  })();
  const dys = (() => {
    const positions = geometry.getAttribute('position').array;
    const numPositions = positions.length / 3;
    const result = new Float32Array(numPositions * 4);

    for (let i = 0; i < numPositions; i++) {
      const baseIndex = i * 4;
      const basePositionIndex = i * 3;
      result[baseIndex + 0] = positions[basePositionIndex + 0];
      result[baseIndex + 1] = positions[basePositionIndex + 1];
      result[baseIndex + 2] = positions[basePositionIndex + 2];
      // result[baseIndex + 3] = 1; // angle factor
      result[baseIndex + 3] = 0;
    }

    return result;
  })();
  geometry.addAttribute('dh', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.addAttribute('dl', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.addAttribute('dr', new THREE.BufferAttribute(drs, 4));
  geometry.addAttribute('dy', new THREE.BufferAttribute(dys, 4));
  geometry.applyMatrix(new THREE.Matrix4().makeTranslation(offset.x, offset.y, offset.z));
  return geometry;
})();

const leftArmBox = (() => {
  const leftArmBox = new THREE.BoxGeometry(3, 12 - esp, 4 - esp, 0, 0, 0); // w/d/h is model-related
  setVertices(leftArmBox,
    toSkinVertices(36, 48, 39, 52),
    toSkinVertices(39, 48, 42, 52),
    toSkinVertices(32, 52, 36, 64),
    toSkinVertices(36, 52, 39, 64),
    toSkinVertices(39, 52, 43, 64),
    toSkinVertices(43, 52, 46, 64)
  );
  const geometry = new THREE.BufferGeometry().fromGeometry(leftArmBox)
    .applyMatrix(new THREE.Matrix4().makeTranslation(0, -12/2, 0));
  const offset = new THREE.Vector3(6, -10 + 12/2 + offsetY, 0);
  const dls = (() => {
    const positions = geometry.getAttribute('position').array;
    const numPositions = positions.length / 3;
    const result = new Float32Array(numPositions * 4);

    for (let i = 0; i < numPositions; i++) {
      const baseIndex = i * 4;
      result[baseIndex + 0] = -offset.x; // because we rotate mesh Y by Math.PI
      result[baseIndex + 1] = offset.y;
      result[baseIndex + 2] = offset.z;
      result[baseIndex + 3] = 1;
    }

    return result;
  })();
  const dys = (() => {
    const positions = geometry.getAttribute('position').array;
    const numPositions = positions.length / 3;
    const result = new Float32Array(numPositions * 4);

    for (let i = 0; i < numPositions; i++) {
      const baseIndex = i * 4;
      const basePositionIndex = i * 3;
      result[baseIndex + 0] = positions[basePositionIndex + 0];
      result[baseIndex + 1] = positions[basePositionIndex + 1];
      result[baseIndex + 2] = positions[basePositionIndex + 2];
      // result[baseIndex + 3] = -1; // angle factor
      result[baseIndex + 3] = 0;
    }

    return result;
  })();
  geometry.addAttribute('dh', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.addAttribute('dl', new THREE.BufferAttribute(dls, 4));
  geometry.addAttribute('dr', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.addAttribute('dy', new THREE.BufferAttribute(dys, 4));
  geometry.applyMatrix(new THREE.Matrix4().makeTranslation(offset.x, offset.y, offset.z));
  return geometry;
})();

const leftArm2Box = (() => {
  const leftArm2Box = new THREE.BoxGeometry(3.375, 13.5 - esp, 4.5 - esp, 0, 0, 0); // w/d/h is model-related
  setVertices(leftArm2Box,
    toSkinVertices(52, 48, 55, 52),
    toSkinVertices(55, 48, 58, 52),
    toSkinVertices(48, 52, 52, 64),
    toSkinVertices(52, 52, 55, 64),
    toSkinVertices(55, 52, 59, 64),
    toSkinVertices(59, 52, 62, 64)
  );
  const geometry = new THREE.BufferGeometry().fromGeometry(leftArm2Box)
    .applyMatrix(new THREE.Matrix4().makeTranslation(0, -12/2, 0));
  const offset = new THREE.Vector3(6, -10 + offsetY + 12/2, 0);
  const dls = (() => {
    const positions = geometry.getAttribute('position').array;
    const numPositions = positions.length / 3;
    const result = new Float32Array(numPositions * 4);

    for (let i = 0; i < numPositions; i++) {
      const baseIndex = i * 4;
      result[baseIndex + 0] = -offset.x; // because we rotate mesh Y by Math.PI
      result[baseIndex + 1] = offset.y;
      result[baseIndex + 2] = offset.z;
      result[baseIndex + 3] = 1;
    }

    return result;
  })();
  const dys = (() => {
    const positions = geometry.getAttribute('position').array;
    const numPositions = positions.length / 3;
    const result = new Float32Array(numPositions * 4);

    for (let i = 0; i < numPositions; i++) {
      const baseIndex = i * 4;
      const basePositionIndex = i * 3;
      result[baseIndex + 0] = positions[basePositionIndex + 0];
      result[baseIndex + 1] = positions[basePositionIndex + 1];
      result[baseIndex + 2] = positions[basePositionIndex + 2];
      // result[baseIndex + 3] = -1; // angle factor
      result[baseIndex + 3] = 0;
    }

    return result;
  })();
  geometry.addAttribute('dh', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.addAttribute('dl', new THREE.BufferAttribute(dls, 4));
  geometry.addAttribute('dr', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.addAttribute('dy', new THREE.BufferAttribute(dys, 4));
  geometry.applyMatrix(new THREE.Matrix4().makeTranslation(offset.x, offset.y, offset.z));
  return geometry;
})();

const rightLegBox = (() => {
  const rightLegBox = new THREE.BoxGeometry(4 - esp, 12 - esp, 4 - esp, 0, 0, 0);
  setVertices(rightLegBox,
    toSkinVertices(4, 16, 8, 20),
    toSkinVertices(8, 16, 12, 20),
    toSkinVertices(0, 20, 4, 32),
    toSkinVertices(4, 20, 8, 32),
    toSkinVertices(8, 20, 12, 32),
    toSkinVertices(12, 20, 16, 32)
  );
  const geometry = new THREE.BufferGeometry().fromGeometry(rightLegBox);
  const dys = (() => {
    const positions = geometry.getAttribute('position').array;
    const numPositions = positions.length / 3;
    const result = new Float32Array(numPositions * 4);

    for (let i = 0; i < numPositions; i++) {
      const baseIndex = i * 4;
      const basePositionIndex = i * 3;
      result[baseIndex + 0] = positions[basePositionIndex + 0];
      result[baseIndex + 1] = positions[basePositionIndex + 1];
      result[baseIndex + 2] = positions[basePositionIndex + 2];
      result[baseIndex + 3] = 1; // angle factor
    }

    return result;
  })();
  geometry.addAttribute('dh', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.addAttribute('dl', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.addAttribute('dr', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.addAttribute('dy', new THREE.BufferAttribute(dys, 4));
  geometry.applyMatrix(new THREE.Matrix4().makeTranslation(-2, -22 + 12/2 + offsetY, 0));
  return geometry;
})();

const rightLeg2Box = (() => {
  const rightLeg2Box = new THREE.BoxGeometry(4.5 - esp, 13.5 - esp, 4.5 - esp, 0, 0, 0);
  setVertices(rightLeg2Box,
    toSkinVertices(4, 32, 8, 36),
    toSkinVertices(8, 32, 12, 36),
    toSkinVertices(0, 36, 4, 48),
    toSkinVertices(4, 36, 8, 48),
    toSkinVertices(8, 36, 12, 48),
    toSkinVertices(12, 36, 16, 48)
  );
  const geometry = new THREE.BufferGeometry().fromGeometry(rightLeg2Box);
  const dys = (() => {
    const positions = geometry.getAttribute('position').array;
    const numPositions = positions.length / 3;
    const result = new Float32Array(numPositions * 4);

    for (let i = 0; i < numPositions; i++) {
      const baseIndex = i * 4;
      const basePositionIndex = i * 3;
      result[baseIndex + 0] = positions[basePositionIndex + 0];
      result[baseIndex + 1] = positions[basePositionIndex + 1];
      result[baseIndex + 2] = positions[basePositionIndex + 2];
      result[baseIndex + 3] = 1; // angle factor
    }

    return result;
  })();
  geometry.addAttribute('dh', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.addAttribute('dl', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.addAttribute('dr', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.addAttribute('dy', new THREE.BufferAttribute(dys, 4));
  geometry.applyMatrix(new THREE.Matrix4().makeTranslation(-2, -22 + offsetY + 12/2, 0));
  return geometry;
})();

const leftLegBox = (() => {
  const leftLegBox = new THREE.BoxGeometry(4 - esp, 12 - esp, 4 - esp, 0, 0, 0);
  setVertices(leftLegBox,
    toSkinVertices(20, 48, 24, 52),
    toSkinVertices(24, 48, 28, 52),
    toSkinVertices(16, 52, 20, 64),
    toSkinVertices(20, 52, 24, 64),
    toSkinVertices(24, 52, 28, 64),
    toSkinVertices(28, 52, 32, 64)
  );
  const geometry = new THREE.BufferGeometry().fromGeometry(leftLegBox);
  const dys = (() => {
    const positions = geometry.getAttribute('position').array;
    const numPositions = positions.length / 3;
    const result = new Float32Array(numPositions * 4);

    for (let i = 0; i < numPositions; i++) {
      const baseIndex = i * 4;
      const basePositionIndex = i * 3;
      result[baseIndex + 0] = positions[basePositionIndex + 0];
      result[baseIndex + 1] = positions[basePositionIndex + 1];
      result[baseIndex + 2] = positions[basePositionIndex + 2];
      result[baseIndex + 3] = -1; // angle factor
    }

    return result;
  })();
  geometry.addAttribute('dh', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.addAttribute('dl', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.addAttribute('dr', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.addAttribute('dy', new THREE.BufferAttribute(dys, 4));
  geometry.applyMatrix(new THREE.Matrix4().makeTranslation(2, -22 + 12/2 + offsetY, 0));
  return geometry;
})();

const leftLeg2Box = (() => {
  const leftLeg2Box = new THREE.BoxGeometry(4.5 - esp, 13.5 - esp, 4.5 - esp, 0, 0, 0);
  setVertices(leftLeg2Box,
    toSkinVertices(4, 48, 8, 52),
    toSkinVertices(8, 48, 12, 52),
    toSkinVertices(0, 52, 4, 64),
    toSkinVertices(4, 52, 8, 64),
    toSkinVertices(8, 52, 12, 64),
    toSkinVertices(12, 52, 16, 64)
  );
  const geometry = new THREE.BufferGeometry().fromGeometry(leftLeg2Box);
  const dys = (() => {
    const positions = geometry.getAttribute('position').array;
    const numPositions = positions.length / 3;
    const result = new Float32Array(numPositions * 4);

    for (let i = 0; i < numPositions; i++) {
      const baseIndex = i * 4;
      const basePositionIndex = i * 3;
      result[baseIndex + 0] = positions[basePositionIndex + 0];
      result[baseIndex + 1] = positions[basePositionIndex + 1];
      result[baseIndex + 2] = positions[basePositionIndex + 2];
      result[baseIndex + 3] = -1; // angle factor
    }

    return result;
  })();
  geometry.addAttribute('dh', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.addAttribute('dl', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.addAttribute('dr', new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').array.length / 3 * 4), 4));
  geometry.addAttribute('dy', new THREE.BufferAttribute(dys, 4));
  geometry.applyMatrix(new THREE.Matrix4().makeTranslation(2, -22 + offsetY + 12/2, 0));
  return geometry;
})();

const skinGeometry = (() => {
  const geometries = [
    headBox,
    head2Box,
    bodyBox,
    body2Box,
    rightArmBox,
    rightArm2Box,
    leftArmBox,
    leftArm2Box,
    rightLegBox,
    rightLeg2Box,
    leftLegBox,
    leftLeg2Box,
  ];

  const positions = new Float32Array(geometries[0].getAttribute('position').array.length * geometries.length);
  const uvs = new Float32Array(geometries[0].getAttribute('uv').array.length * geometries.length);
  const dhs = new Float32Array(geometries[0].getAttribute('dh').array.length * geometries.length);
  const dls = new Float32Array(geometries[0].getAttribute('dl').array.length * geometries.length);
  const drs = new Float32Array(geometries[0].getAttribute('dr').array.length * geometries.length);
  const dys = new Float32Array(geometries[0].getAttribute('dy').array.length * geometries.length);
  let positionIndex = 0;
  let dhIndex = 0;
  let uvIndex = 0;

  for (let i = 0; i < geometries.length; i++) {
    const newGeometry = geometries[i];
    const newPositions = newGeometry.getAttribute('position').array;
    positions.set(newPositions, positionIndex);
    const newUvs = newGeometry.getAttribute('uv').array;
    uvs.set(newUvs, uvIndex);
    const newDhs = newGeometry.getAttribute('dh').array;
    dhs.set(newDhs, dhIndex);
    const newDls = newGeometry.getAttribute('dl').array;
    dls.set(newDls, dhIndex);
    const newDrs = newGeometry.getAttribute('dr').array;
    drs.set(newDrs, dhIndex);
    const newDys = newGeometry.getAttribute('dy').array;
    dys.set(newDys, dhIndex);

    positionIndex += newPositions.length;
    dhIndex += newDhs.length;
    uvIndex += newUvs.length;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.addAttribute('dh', new THREE.BufferAttribute(dhs, 4));
  geometry.addAttribute('dl', new THREE.BufferAttribute(dls, 4));
  geometry.addAttribute('dr', new THREE.BufferAttribute(drs, 4));
  geometry.addAttribute('dy', new THREE.BufferAttribute(dys, 4));
  geometry.applyMatrix(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0, Math.PI, 0, rotationOrder)));
  geometry.boundingSphere = new THREE.Sphere(
    new THREE.Vector3(0, 0, 0),
    2 / scale
  );
  return geometry;
})();

const _requestImage = src => new Promise((accept, reject) => {
  const img = new Image();
  img.onload = () => {
    accept(img);
  };
  img.onerror = err => {
    reject(img);
  };
  // img.crossOrigin = 'Anonymous';
  img.src = src;
});
const _requestImageBitmap = src => _requestImage(src)
  .then(img => createImageBitmap(img, 0, 0, img.width, img.height, {
    imageOrientation: 'flipY',
  }));

const skin = ({limbs = false} = {}) => {
  const texture = new THREE.Texture();
	texture.magFilter = THREE.NearestFilter;
	texture.minFilter = THREE.NearestMipMapNearestFilter;

  const material = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(SKIN_SHADER.uniforms),
    vertexShader: SKIN_SHADER.vertexShader,
    fragmentShader: SKIN_SHADER.fragmentShader,
    side: THREE.DoubleSide,
    transparent: true,
  });
  material.volatile = true;

  const mesh = new THREE.Mesh(skinGeometry, material);
  mesh.position.y = 0.18;
  mesh.scale.set(scale, scale, scale);
  mesh.rotation.order = rotationOrder;
  mesh.updateMatrixWorld();

  mesh.setImage = img => {
    texture.image = img;
    texture.needsUpdate = true;
  };

  mesh.size = skinSize;

  if (limbs) {
    const head = new THREE.Object3D();
    head.position.y = offsetY;
    mesh.add(head);
    mesh.head = head;
    const eye = new THREE.Object3D();
    eye.position.z = -8/2;
    head.add(eye);
    mesh.eye = eye;

    const leftArm = new THREE.Object3D();
    leftArm.position.set(-6, -10 + 12/2 + offsetY, 0);
    mesh.add(leftArm);
    const rightArm = new THREE.Object3D();
    rightArm.position.set(6, -10 + 12/2 + offsetY, 0);
    mesh.add(rightArm);
    mesh.arms = {
      left: leftArm,
      right: rightArm,
    };
  }

  mesh.onBeforeRender = () => {
    material.uniforms.map.value = texture;
  };

  mesh.destroy = () => {
    // material.dispose();
    texture.dispose();
  };

  return mesh;
};
skin.SKIN_SHADER = SKIN_SHADER;

return skin;

})();
