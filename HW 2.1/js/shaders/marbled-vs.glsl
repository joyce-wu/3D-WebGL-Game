Shader.source[document.currentScript.src.split('js/shaders/')[1]] = `#version 300 es
  in vec4 vertexPosition;
  out vec4 modelPosition;

  uniform struct {
  	mat4 modelMatrix;
  } gameObject;

  uniform struct {
    mat4 viewProjMatrix;
  } camera;

  void main(void) {
    modelPosition = vertexPosition;
    gl_Position = vertexPosition * gameObject.modelMatrix * camera.viewProjMatrix;
  }
`;
