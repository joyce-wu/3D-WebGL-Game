Shader.source[document.currentScript.src.split('js/shaders/')[1]] = `#version 300 es
  in vec4 vertexPosition;
  in vec4 vertexTexCoord;
  in vec3 vertexNormal;
  out vec4 tex; // passed to FS
  out vec4 modelPosition;
  out vec4 worldPosition;
  out vec4 worldNormal;
  out vec3 viewDir;

  uniform struct {
  	mat4 modelMatrix;
    mat4 modelMatrixInverse;
  } gameObject;

  uniform struct {
    mat4 viewProjMatrix;
    vec3 position;
  } camera;

  void main(void) {
  	tex = vertexTexCoord;
    modelPosition = vertexPosition;
    worldPosition = vertexPosition * gameObject.modelMatrix;
    gl_Position = vertexPosition * gameObject.modelMatrix * camera.viewProjMatrix;
    worldNormal = gameObject.modelMatrixInverse * vec4(vertexNormal, 0);
    viewDir = normalize(camera.position.xyz - worldPosition.xyz);
  }
`;
