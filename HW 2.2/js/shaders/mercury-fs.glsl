Shader.source[document.currentScript.src.split('js/shaders/')[1]] = `#version 300 es
  precision highp float;

  out vec4 fragmentColor;
  in vec4 color;
  in vec4 tex;
  in vec4 worldNormal;
  in vec3 viewDir;
  in vec4 modelPosition;

  uniform struct {
    samplerCube envmapTexture;
  } material;

  void main(void) {
    vec3 normal = normalize(worldNormal.xyz);
    fragmentColor = texture(material.envmapTexture, reflect(-viewDir, normal));
  }
`;
