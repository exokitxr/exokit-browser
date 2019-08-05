// Copyright 2018 Google Inc.
attribute vec4 a_position;
attribute vec3 a_normal;
attribute vec4 a_color;
attribute vec4 a_texcoord0;
attribute vec4 a_texcoord1;
varying vec4 v_color;
varying vec3 v_normal;
varying vec3 v_position;
varying vec2 v_texcoord0;
varying vec3 v_light_dir_0;
varying vec3 v_light_dir_1;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform mat4 u_SceneLight_0_matrix;
uniform mat4 u_SceneLight_1_matrix;
mat4 inverse(mat4 m) {
float
a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3],
a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3],
a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3],
a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3],
b00 = a00 * a11 - a01 * a10,
b01 = a00 * a12 - a02 * a10,
b02 = a00 * a13 - a03 * a10,
b03 = a01 * a12 - a02 * a11,
b04 = a01 * a13 - a03 * a11,
b05 = a02 * a13 - a03 * a12,
b06 = a20 * a31 - a21 * a30,
b07 = a20 * a32 - a22 * a30,
b08 = a20 * a33 - a23 * a30,
b09 = a21 * a32 - a22 * a31,
b10 = a21 * a33 - a23 * a31,
b11 = a22 * a33 - a23 * a32,
det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
return mat4(
a11 * b11 - a12 * b10 + a13 * b09,
a02 * b10 - a01 * b11 - a03 * b09,
a31 * b05 - a32 * b04 + a33 * b03,
a22 * b04 - a21 * b05 - a23 * b03,
a12 * b08 - a10 * b11 - a13 * b07,
a00 * b11 - a02 * b08 + a03 * b07,
a32 * b02 - a30 * b05 - a33 * b01,
a20 * b05 - a22 * b02 + a23 * b01,
a10 * b10 - a11 * b08 + a13 * b06,
a01 * b08 - a00 * b10 - a03 * b06,
a30 * b04 - a31 * b02 + a33 * b00,
a21 * b02 - a20 * b04 - a23 * b00,
a11 * b07 - a10 * b09 - a12 * b06,
a00 * b09 - a01 * b07 + a02 * b06,
a31 * b01 - a30 * b03 - a32 * b00,
a20 * b03 - a21 * b01 + a22 * b00) / det;
}
const float kRecipSquareRootOfTwo = 0.70710678;
vec3 recreateCorner(vec3 center, float corner, float rotation, float size) {
float c = cos(rotation);
float s = sin(rotation);
vec3 up = vec3(s, c, 0);
vec3 right = vec3(c, -s, 0);
float fUp = float(corner == 0. || corner == 1.) * 2.0 - 1.0;
float fRight = float(corner == 0. || corner == 2.) * 2.0 - 1.0;
center = (modelViewMatrix * vec4(center, 1.0)).xyz;
center += fRight * right * size;
center += fUp * up * size;
return (inverse(modelViewMatrix) * vec4(center, 1.0)).xyz;
}
vec4 PositionParticle(
float vertexId,
vec4 vertexPos,
vec3 center,
float rotation) {
float corner = mod(vertexId, 4.0);
float size = length(vertexPos.xyz - center) * kRecipSquareRootOfTwo;
float scale = modelMatrix[1][1];
vec3 newCorner = recreateCorner(center, corner, rotation, size * scale);
return vec4(newCorner.x, newCorner.y, newCorner.z, 1);
}
#define PARTICLE_CENTER (a_normal)
#define PARTICLE_VERTEXID (a_texcoord1.w)
#define PARTICLE_ROTATION (a_texcoord0.z)
vec4 GetParticlePositionLS() {
return PositionParticle(PARTICLE_VERTEXID, a_position, PARTICLE_CENTER, PARTICLE_ROTATION);
}
void main() {
vec4 pos = GetParticlePositionLS();
gl_Position = projectionMatrix * modelViewMatrix * pos;
v_normal = normalMatrix * a_normal;
v_position = (modelViewMatrix * pos).xyz;
v_light_dir_0 = u_SceneLight_0_matrix[2].xyz;
v_light_dir_1 = u_SceneLight_1_matrix[2].xyz;
v_color = a_color;
v_texcoord0 = a_texcoord0.xy;
}
