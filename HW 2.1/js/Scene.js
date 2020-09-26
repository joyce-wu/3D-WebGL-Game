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
    this.fsMarbled = new Shader(gl, gl.FRAGMENT_SHADER, "marbled-fs.glsl");
    this.vsMarbled = new Shader(gl, gl.VERTEX_SHADER, "marbled-vs.glsl");
    this.fsPlane = new Shader(gl, gl.FRAGMENT_SHADER, "plane-fs.glsl");
    this.vsPlane = new Shader(gl, gl.VERTEX_SHADER, "plane-vs.glsl");
    this.programs.push(
      this.planeProgram = new TexturedProgram(gl, this.vsPlane, this.fsPlane));
    this.programs.push(
    	this.texturedProgram = new TexturedProgram(gl, this.vsTextured, this.fsTextured));
    this.programs.push(
      this.backgroundProgram = new TexturedProgram(gl, this.vsBackground, this.fsBackground));
    this.programs.push(
      this.marbledProgram = new TexturedProgram(gl, this.vsMarbled, this.fsMarbled));
    this.texturedQuadGeometry = new TexturedQuadGeometry(gl);
    this.texturedPlaneGeometry = new TexturedPlaneGeometry(gl);

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
    this.background.update = this.background.update = function(){};
    this.gameObjects.push(this.background);

    this.planeMaterial = new Material(this.planeProgram);
    this.planeMaterial.colorTexture.set(new Texture2D(gl, "media/galaxy.png"));
    this.planeMesh = new Mesh(this.planeMaterial, this.texturedPlaneGeometry);
    this.plane = new GameObject(this.planeMesh);
    this.gameObjects.push(this.plane);

    this.slowpokeMaterial = new Material(this.texturedProgram);
    this.slowpokeMaterial.colorTexture.set(new Texture2D(gl, "media/slowpoke/YadonDh.png"));
    this.eyeMaterial = new Material(this.texturedProgram);
    this.eyeMaterial.colorTexture.set(new Texture2D(gl, "media/slowpoke/YadonEyeDh.png"));

    this.mesh = new MultiMesh(gl, "media/slowpoke/Slowpoke.json",
        [this.slowpokeMaterial, this.eyeMaterial]);

    this.avatar =  new GameObject(this.mesh);
    this.avatar.position.set(0, 0.5, 0);
    this.avatar.scale.set(0.2, 0.2, 0.2);
    this.gameObjects.push(this.avatar);

    this.ballMaterial = new Material(this.marbledProgram);
    this.ballMaterial.lightMarbleColor = new Vec3(1, 0.8, 0.7);
    this.ballMaterial.darkMarbleColor = new Vec3(0, 0, 0.5);
    this.ballMaterial.freq = 10;
    this.ballMaterial.noiseExp = 1;
    this.ballMaterial.noiseFreq = 10;
    this.ballMaterial.noiseAmp = 75;
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

      this.modelMatrix.set().
      	scale(this.scale).
      	rotate(this.roll).
          rotate(this.pitch, 1, 0, 0).
          rotate(this.yaw, 0, 1, 0).
      	translate(this.position);
    };

    const ballMove = function(t, dt) {
      const ahead = new Vec3( Math.sin(this.yaw), 0, Math.cos(this.yaw));
      this.velocity.addScaled(dt * this.invMass, this.force);
      this.position.addScaled(dt, this.velocity);

      const aheadVelocityMagnitude = ahead.dot(this.velocity);
      const aheadVelocity = ahead.times(aheadVelocityMagnitude);
      const sideVelocity = this.velocity.minus(aheadVelocity);
      this.velocity.set(0, 0, 0);
      this.velocity.addScaled(Math.pow(this.backDrag, dt), aheadVelocity);
      this.velocity.addScaled(Math.pow(this.sideDrag, dt), sideVelocity);

      this.angularVelocity = this.velocity.dot(this.velocity);
      const up = new Vec3(0, 1, 0);
      this.rotationalAxis.setVectorProduct(this.velocity, up);
      this.rotationalAngle -= this.angularVelocity * dt;
      this.modelMatrix.set().
      rotate(this.rotationalAngle, this.rotationalAxis.x, this.rotationalAxis.y, this.rotationalAxis.z).
      translate(this.position);

    };

    for(let i=0; i < 64; i++){
      const ball = new GameObject( this.ballMesh );
      ball.position.setRandom(new Vec3(-22, 1, -22, 0), new Vec3(22, 1, 22) );
      ball.velocity.setRandom(new Vec3(-2, 0, -2), new Vec3(2, 0, 2));
      this.gameObjects.push(ball);
      ball.move = ballMove;
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
        if(dist2 < 3.5) {
          diff.mul( 1.0 / Math.sqrt(dist2) );
          this.position.addScaled(0.01, diff);
          other.position.addScaled(-0.01, diff);
          other.position.y = 1;
          this.position.y = 0.5;
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
    this.camera.position.set(0, 5, 25);
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
        gameObject.draw(this, this.camera);
    }

    // this.camera.ahead.set(this.avatar.position.minus(this.camera.position));
    this.camera.avatarPosition.set(this.avatar.position);
    this.camera.move(dt, keysPressed);
  }
}
