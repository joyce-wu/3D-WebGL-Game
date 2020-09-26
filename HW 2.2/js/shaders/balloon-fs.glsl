Shader.source[document.currentScript.src.split('js/shaders/')[1]] = `#version 300 es
  precision highp float;

  out vec4 fragmentColor;
  in vec4 color;
  in vec4 tex;
  in vec4 modelPosition;
  in vec4 worldPosition;
  in vec4 worldNormal;
  in vec3 viewDir;

  uniform struct {
  	vec4 solidColor;
  	sampler2D colorTexture;
    vec3 specularColor;
    float shininess;
  } material;

  uniform struct {
    float time;
    float num_lights;
  } scene;

  uniform struct {
    vec4 position;
    vec3 powerDensity;
  } lights[8];

  vec3 shade(vec3 normal, vec3 lightDir, vec3 viewDir,
             vec3 powerDensity, vec3 materialColor, vec3 specularColor, float shininess) {

    float cosa = clamp( dot(lightDir, normal), 0.0, 1.0);
    vec3 halfway = normalize(viewDir + lightDir);
    float cosDelta = clamp(dot(halfway, normal), 0.0, 1.0);


    return powerDensity * materialColor * cosa
    + powerDensity * specularColor * pow(cosDelta, shininess);
  }

  void main(void) {
    vec3 color = vec3(0, 0, 0);
    for(int i = 0; i < 3; i++){
      vec3 lightDiff = lights[i].position.xyz - worldPosition.xyz * lights[i].position.w;
      vec3 lightDir = normalize(lightDiff);
      float distanceSquared = dot(lightDiff, lightDiff);
      vec3 powerDensity = lights[i].powerDensity / distanceSquared;

      color += shade(worldNormal.xyz, lightDir, viewDir, powerDensity,
        texture(material.colorTexture, tex.xy/tex.w).rgb,
        material.specularColor, material.shininess);

    }
    fragmentColor = vec4(color, 1.0);
  }
`;
