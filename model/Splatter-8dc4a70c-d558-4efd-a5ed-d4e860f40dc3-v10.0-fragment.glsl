// Copyright 2018 Google Inc.
precision mediump float;
uniform vec4 u_ambient_light_color;
uniform vec4 u_SceneLight_0_color;
uniform vec4 u_SceneLight_1_color;
varying vec4 v_color;
varying vec3 v_normal;
varying vec3 v_position;
varying vec3 v_light_dir_0;
varying vec3 v_light_dir_1;
varying vec2 v_texcoord0;
uniform sampler2D u_MainTex;
uniform float u_Cutoff;
uniform vec3 u_fogColor;
uniform float u_fogDensity;
varying float f_fog_coord;
vec3 ApplyFog(vec3 color) {
float density = (u_fogDensity / .693147) * 10.;
float fogFactor = f_fog_coord * density;
fogFactor = exp2(-fogFactor);
fogFactor = clamp( fogFactor, 0.0, 1.0 );
return mix(u_fogColor, color.xyz, fogFactor);
}
const float PI = 3.141592654;
const float INV_PI = 0.318309886;
const vec3 GAMMA_DIELECTRIC_SPEC = vec3(0.220916301, 0.220916301, 0.220916301);
const float GAMMA_ONE_MINUS_DIELECTRIC = (1.0 - 0.220916301);
float Pow5(float x) {
return x * x * x * x * x;
}
float DisneyDiffuseTerm(float NdotV, float NdotL, float LdotH,
float perceptualRoughness) {
float fd90 = 0.5 + 2.0 * LdotH * LdotH * perceptualRoughness;
float lightScatter = 1.0 + (fd90 - 1.0) * Pow5(1.0 - NdotL);
float viewScatter = 1.0 + (fd90 - 1.0) * Pow5(1.0 - NdotV);
return lightScatter * viewScatter;
}
float SmithJointVisibilityTerm(float NdotL, float NdotV, float roughness) {
float lambdaV = NdotL * mix(NdotV, 1.0, roughness);
float lambdaL = NdotV * mix(NdotL, 1.0, roughness);
return 0.5 / (lambdaV + lambdaL + 1e-5);
}
float GgxDistributionTerm(float NdotH, float roughness) {
float a2 = roughness * roughness;
float d = (NdotH * a2 - NdotH) * NdotH + 1.0;
return INV_PI * a2 / (d * d + 1e-7);
}
vec3 FresnelTerm (vec3 F0, float cosA) {
float t = Pow5(1.0 - cosA);
return F0 + (vec3(1.0) - F0) * t;
}
vec3 SurfaceShaderInternal(
vec3 normal,
vec3 lightDir,
vec3 eyeDir,
vec3 lightColor,
vec3 diffuseColor,
vec3 specularColor,
float perceptualRoughness) {
float NdotL = clamp(dot(normal, lightDir), 0.0, 1.0);
float NdotV = abs(dot(normal, eyeDir));
vec3 halfVector = normalize(lightDir + eyeDir);
float NdotH = clamp(dot(normal, halfVector), 0.0, 1.0);
float LdotH = clamp(dot(lightDir, halfVector), 0.0, 1.0);
float diffuseTerm = NdotL *
DisneyDiffuseTerm(NdotV, NdotL, LdotH, perceptualRoughness);
if (length(specularColor) < 1e-5) {
return diffuseColor * (lightColor * diffuseTerm);
}
float roughness = perceptualRoughness * perceptualRoughness;
float V = GgxDistributionTerm(NdotH, roughness);
float D = SmithJointVisibilityTerm(NdotL, NdotV, roughness);
float specularTerm = V * D * PI;
specularTerm = sqrt(max(1e-4, specularTerm));
specularTerm *= NdotL;
vec3 fresnelColor = FresnelTerm(specularColor, LdotH);
return lightColor *
(diffuseTerm * diffuseColor + specularTerm * fresnelColor);
}
vec3 SurfaceShaderSpecularGloss(
vec3 normal,
vec3 lightDir,
vec3 eyeDir,
vec3 lightColor,
vec3 albedoColor,
vec3 specularColor,
float gloss) {
float oneMinusSpecularIntensity =
1.0 - clamp(max(max(specularColor.r, specularColor.g), specularColor.b), 0., 1.);
vec3 diffuseColor = albedoColor * oneMinusSpecularIntensity;
float perceptualRoughness = 1.0 - gloss;
return SurfaceShaderInternal(
normal, lightDir, eyeDir, lightColor, diffuseColor, specularColor, perceptualRoughness);
}
vec3 SurfaceShaderMetallicRoughness(
vec3 normal,
vec3 lightDir,
vec3 eyeDir,
vec3 lightColor,
vec3 albedoColor,
float metallic,
float perceptualRoughness) {
vec3 specularColor = mix(GAMMA_DIELECTRIC_SPEC, albedoColor, metallic);
float oneMinusReflectivity = GAMMA_ONE_MINUS_DIELECTRIC - metallic * GAMMA_ONE_MINUS_DIELECTRIC;
vec3 diffuseColor = albedoColor * oneMinusReflectivity;
return SurfaceShaderInternal(
normal, lightDir, eyeDir, lightColor, diffuseColor, specularColor, perceptualRoughness);
}
vec3 ShShaderWithSpec(
vec3 normal,
vec3 lightDir,
vec3 lightColor,
vec3 diffuseColor,
vec3 specularColor) {
float specularGrayscale = dot(specularColor, vec3(0.3, 0.59, 0.11));
float NdotL = clamp(dot(normal, lightDir), 0.0, 1.0);
float shIntensityMultiplier = 1. - specularGrayscale;
shIntensityMultiplier *= shIntensityMultiplier;
return diffuseColor * lightColor * NdotL * shIntensityMultiplier;
}
vec3 ShShader(
vec3 normal,
vec3 lightDir,
vec3 lightColor,
vec3 diffuseColor) {
return ShShaderWithSpec(normal, lightDir, lightColor, diffuseColor, vec3(0.,0.,0.));
}
vec3 LambertShader(
vec3 normal,
vec3 lightDir,
vec3 lightColor,
vec3 diffuseColor) {
float NdotL = clamp(dot(normal, lightDir), 0.0, 1.0);
return diffuseColor * lightColor * NdotL;
}
vec3 computeLighting() {
vec3 normal = normalize(v_normal);
if (!gl_FrontFacing) {
normal *= -1.0;
}
vec3 lightDir0 = normalize(v_light_dir_0);
vec3 lightDir1 = normalize(v_light_dir_1);
vec3 lightOut0 = LambertShader(normal, lightDir0,
u_SceneLight_0_color.rgb, v_color.rgb);
vec3 lightOut1 = ShShader(normal, lightDir1,
u_SceneLight_1_color.rgb, v_color.rgb);
vec3 ambientOut = v_color.rgb * u_ambient_light_color.rgb;
return (lightOut0 + lightOut1 + ambientOut);
}
void main() {
float brush_mask = texture2D(u_MainTex, v_texcoord0).w;
if (brush_mask > u_Cutoff) {
gl_FragColor.rgb = ApplyFog(computeLighting());
gl_FragColor.a = 1.0;
} else {
discard;
}
}
