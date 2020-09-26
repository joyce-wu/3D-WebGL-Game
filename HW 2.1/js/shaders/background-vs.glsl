Shader.source[document.currentScript.src.split('js/shaders/')[1]] = `#version 300 es
  in vec4 vertexPosition;
  in vec4 vertexTexCoord;
  out vec4 rayDir;

  uniform struct {
  	mat4 modelMatrix;
  } gameObject;

  uniform struct {
    mat4 viewProjMatrix;
    mat4 rayDirMatrix;
  } camera;

  void main(void) {
    gl_Position = vertexPosition;
    gl_Position.z = 0.999999;
    rayDir = vertexPosition * camera.rayDirMatrix;
  }
`;
