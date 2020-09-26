"use strict";
/* exported Scene */
class Scene extends UniformProvider {
  constructor(gl) {
    super("scene");
    this.programs = [];

    this.fsTextured = new Shader(gl, gl.FRAGMENT_SHADER, "textured-fs.glsl");
    this.vsTextured = new Shader(gl, gl.VERTEX_SHADER, "textured-vs.glsl");
    this.fsBackground = new Shader(gl, gl.FRAGMENT_SHADER, "background-fs.glsl");
    this.vsBackground = new Shader(gl, gl.VERTEX_SHADER, "background-vs.glsl");
    this.fsLight = new Shader(gl, gl.FRAGMENT_SHADER, "light-fs.glsl");
    this.fsMercury = new Shader(gl, gl.FRAGMENT_SHADER, "mercury-fs.glsl");
    this.fsBalloon = new Shader(gl, gl.FRAGMENT_SHADER, "balloon-fs.glsl");
    this.programs.push(
      this.treeProgram = new TexturedProgram(gl, this.vsTextured, this.fsBalloon));
    this.programs.push(
      this.mercuryProgram = new TexturedProgram(gl, this.vsTextured, this.fsMercury));
    this.programs.push(
      this.avatarProgram = new TexturedProgram(gl, this.vsTextured, this.fsLight));
    this.programs.push(
      this.backgroundProgram = new TexturedProgram(gl, this.vsBackground, this.fsBackground));
    this.programs.push(
    	this.texturedProgram = new TexturedProgram(gl, this.vsTextured, this.fsTextured));
    this.texturedQuadGeometry = new TexturedQuadGeometry(gl);

    this.timeAtFirstFrame = new Date().getTime();
    this.timeAtLastFrame = this.timeAtFirstFrame;

    this.gameObjects = [];

    this.backgroundMaterial = new Material(this.backgroundProgram);
    this.envTexture = new TextureCube(gl, [
      "media/galaxy_square.jpg",
      "media/galaxy_square.jpg",
      "media/galaxy_square.jpg",
      "media/galaxy_square.jpg",
      "media/galaxy_square.jpg",
      "media/galaxy_square.jpg"]
      );
    this.backgroundMaterial.envTexture.set(this.envTexture);
    this.backgroundMesh = new Mesh(this.backgroundMaterial, this.texturedQuadGeometry);
    this.background = new GameObject(this.backgroundMesh);
    this.background.update = function(){};
    this.gameObjects.push(this.background);

    this.slowpokeMaterial = new Material(this.avatarProgram);
    this.slowpokeMaterial.colorTexture.set(new Texture2D(gl, "media/slowpoke/YadonDh.png"));
    this.slowpokeMaterial.shininess = 10;
    this.slowpokeMaterial.specularColor.set(1, 1, 1);
    this.mesh = new MultiMesh(gl, "media/slowpoke/Slowpoke.json",
        [this.slowpokeMaterial, this.slowpokeMaterial]);
    this.avatar =  new GameObject(this.mesh);
    this.avatar.position.set(0, 1, 0);
    this.avatar.scale.set(0.5, 0.5, 0.5);
    this.gameObjects.push(this.avatar);

    this.num_lights = 2;
    this.lights = [];
    this.lights.push(new Light(this.lights.length, ...this.programs));
    this.lights[0].position.set(1, 5, 1, 1);
    this.lights[0].powerDensity.set(10, 10, 10);
    this.lights.push(new Light(this.lights.length, ...this.programs));
    this.lights[1].position.set(1, 1, 0, 0).normalize();
    this.lights[1].powerDensity.set(1, 1, 1);
    this.lights.push(new Light(this.lights.length, ...this.programs));
    this.lights[2].position.set(5, 5, 1, 0).normalize();
    this.lights[2].powerDensity.set(1, 1, 0);


    this.treeMaterial = new Material(this.treeProgram);
    this.treeMaterial.colorTexture.set(new Texture2D(gl, "media/tree.png"));
    this.treeMaterial.shininess = 10;
    this.treeMaterial.specularColor.set(0, 0, 0);
    this.treeMesh = new MultiMesh(gl, "media/smoothtree.json", [this.treeMaterial]);
    const treeMove = function(t, dt) {
      if (this.position.y >= 15) {
        this.goDown = true;
      } else if ( this.position.y <= -15) {
        this.goDown = false;
      }
      if(this.goDown){
        this.position.y -= 0.05;
      } else {
        this.position.y += 0.05;
      }
    }
    for(let i = 0; i < 25; i++) {
      const tree = new GameObject(this.treeMesh);
      tree.scale.set(0.06, 0.06, 0.06);
      tree.position.setRandom(new Vec3(-22, -12, -22), new Vec3(22, 12, 22) );
      tree.move = treeMove;
      this.gameObjects.push(tree);
    }

	  this.ballMaterial = new Material(this.mercuryProgram);
    this.skyCubeTexture = new TextureCube(gl, [
      "media/galaxy_square.jpg",
      "media/galaxy_square.jpg",
      "media/galaxy_square.jpg",
      "media/galaxy_square.jpg",
      "media/galaxy_square.jpg",
      "media/galaxy_square.jpg"
    ]);
    this.ballMaterial.envmapTexture.set(this.skyCubeTexture);
    this.ballMesh = new MultiMesh(gl, "media/sphere.json", [this.ballMaterial]);
    const genericMove = function(t, dt){
      const ahead = new Vec3( Math.sin(this.yaw), 0, Math.cos(this.yaw));
      this.velocity.addScaled(dt * this.invMass, this.force);
      this.position.addScaled(dt, this.velocity);
      this.angularVelocity += dt * this.invAngularMass * this.torque;
      this.yaw += dt * this.angularVelocity;
      const aheadVelocityMagnitude = ahead.dot(this.velocity);
      const aheadVelocity = ahead.times(aheadVelocityMagnitude);
      const sideVelocity = this.velocity.minus(aheadVelocity);
      this.velocity.set(0, 0, 0);
      this.velocity.addScaled(Math.pow(this.backDrag, dt), aheadVelocity);
      this.velocity.addScaled(Math.pow(this.sideDrag, dt), sideVelocity);
      this.angularVelocity *= Math.pow(this.angularDrag, dt);
    };

    for(let i=0; i < 64; i++){
      const ball = new GameObject( this.ballMesh );
      ball.position.setRandom(new Vec3(-22, -22, -22), new Vec3(22, 22, 22) );
      ball.velocity.setRandom(new Vec3(-2, 0, -2), new Vec3(2, 0, 2));
      this.gameObjects.push(ball);
      ball.move = genericMove;
      ball.scale.set(1.1, 1.1, 1.1);
    }

    this.avatar.backDrag = 0.9;
    this.avatar.sideDrag = 0.5;
    this.avatar.angularDrag = 0.5;
    this.avatar.control = function(t, dt, keysPressed, colliders){
      this.thrust = 0;
      if(keysPressed.UP) {
        this.thrust += 5;
      }
      if(keysPressed.DOWN) {
        this.thrust -= 5;
      }
      this.torque = 0;
      if(keysPressed.LEFT) {
        this.torque += 2;
      }
      if(keysPressed.RIGHT) {
        this.torque -= 2;
      }
      let ahead = new Vec3( Math.sin(this.yaw), 0, Math.cos(this.yaw));
      this.force = ahead.times(this.thrust);

      const relativeVelocity = new Vec2();
      let diff = new Vec3();
      for(let i=0; i<colliders.length; i++) {
        const other = colliders[i];
        if(other === this) {
          continue;
        }
        diff.set(this.position).sub(other.position);
        const dist2 = diff.dot(diff);
        if(dist2 < 4) {
          diff.mul( 1.0 / Math.sqrt(dist2) );
          this.position.addScaled(0.05, diff);
          other.position.addScaled(-0.05, diff);
          let tangent = diff.cross(new Vec3(0, 1, 0));
          let vi = this.velocity;
          let bi = this.angularVelocity;
          let vj = other.velocity;
          let bj = other.angularVelocity;
          relativeVelocity.set(vi).sub(vj).addScaled(-bi - bj, tangent).mul(0.5);
          const impulseLength = diff.dot(relativeVelocity);
          diff.mul( impulseLength * 1.5 /*restitution*/ );
          const frictionLength = tangent.dot(relativeVelocity);
          tangent.mul(frictionLength * 0.5 /*friction*/);
          vi.sub(diff).sub(tangent);
          vj.add(diff).add(tangent);
          this.angularVelocity += frictionLength /* *radius*/ ;
          other.angularVelocity += frictionLength  /* *radius*/ ;
        }
      }
    };
    this.avatar.move = genericMove;
    this.camera = new PerspectiveCamera(...this.programs);
    this.camera.position.set(0, 5, 20);
    this.camera.update();
    this.addComponentsAndGatherUniforms(...this.programs);

    gl.enable(gl.DEPTH_TEST);
  }

  resize(gl, canvas) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    this.camera.setAspectRatio(canvas.width / canvas.height);
  }

  update(gl, keysPressed) {
    //jshint bitwise:false
    //jshint unused:false
    const timeAtThisFrame = new Date().getTime();
    const dt = (timeAtThisFrame - this.timeAtLastFrame) / 1000.0;
    const t = (timeAtThisFrame - this.timeAtFirstFrame) / 1000.0;
    this.timeAtLastFrame = timeAtThisFrame;
    //this.time.set(t);
    this.time = t;

    // clear the screen
    gl.clearColor(0.3, 0.0, 0.3, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    this.camera.move(dt, keysPressed);

	for(const gameObject of this.gameObjects) {
      gameObject.control(t, dt, keysPressed, this.gameObjects);
    }

    for(const gameObject of this.gameObjects) {
      gameObject.move(t, dt);
    }

    for(const gameObject of this.gameObjects) {
        gameObject.update();
    }
    for(const gameObject of this.gameObjects) {
        gameObject.draw(this, this.camera, ...this.lights);
    }
  }
}
