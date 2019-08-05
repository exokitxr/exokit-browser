// Copyright 2018 Google Inc.
precision mediump float;
varying vec4 v_color;
varying vec2 v_texcoord0;
uniform sampler2D u_MainTex;
uniform vec4 u_TintColor;
uniform float u_EmissionGain;
void main() {
vec4 color = 2.0 * v_color * u_TintColor * texture2D(u_MainTex, v_texcoord0);
gl_FragColor = vec4(color.rgb * color.a, 1.0);
}
