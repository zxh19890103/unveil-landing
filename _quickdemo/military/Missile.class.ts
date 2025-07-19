import { sliceCurve, sounds } from "@/_shared/index.js";
import * as THREE from "three";
import { BufferGeometry, ShaderMaterial, AdditiveBlending } from "three";

export class Missile extends THREE.Object3D {
  public curve: THREE.QuadraticBezierCurve3;
  public tail: THREE.Mesh<THREE.TubeGeometry, THREE.MeshBasicMaterial>;

  private t = 0;
  private speed: number;
  private opacity = 0.55;
  private length = 0;

  constructor(
    public from: THREE.Vector3,
    public to: THREE.Vector3,
    speed = 3
  ) {
    super();

    this.speed = speed;

    const h = from.distanceTo(to) * Math.tan(60 * THREE.MathUtils.DEG2RAD);

    const control = this.computeControlPoint(from, to, h);
    this.curve = new THREE.QuadraticBezierCurve3(from, control, to);
    this.length = this.curve.getLength();

    const curve = sliceCurve(this.curve, 0, 1);
    const tubeGeo = new THREE.TubeGeometry(curve, 300, 0.1, 5, false);

    const tube = new THREE.Mesh(
      tubeGeo,
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: this.opacity,
        color: 0xffaa00,
      })
    );

    this.tail = tube;

    this.add(tube);
  }

  private computeControlPoint(
    from: THREE.Vector3,
    to: THREE.Vector3,
    height = 20
  ) {
    const mid = from.clone().lerp(to, 0.5);
    mid.y += height;
    return mid;
  }

  private phase = 1;
  private explosion: Explosion;

  update(deltaTime: number) {
    switch (this.phase) {
      case 1: {
        this.t += deltaTime * this.speed / this.length;
        this.t = THREE.MathUtils.clamp(this.t, 0, 1);

        const curve = sliceCurve(this.curve, 0, this.t);

        this.tail.geometry.dispose();

        const tubeGeo = new THREE.TubeGeometry(curve, 300, 0.1, 5, false);
        this.tail.geometry = tubeGeo;

        if (this.t >= 1) {
          this.explosion = new Explosion(500);
          this.curve.getPointAt(1, this.explosion.position);
          this.add(this.explosion);
          sounds.bomb.play();
          this.phase = 2;
        }

        break;
      }
      case 2: {
        if (!this.explosion.update(deltaTime)) {
          this.phase = 3;
          break;
        }

        this.opacity -= 0.003;

        if (this.opacity > 0) {
          this.tail.material.opacity = this.opacity;
          this.tail.material.needsUpdate = true;
        }
        break;
      }
      case 3: {
        this.removeFromParent();
        this.dispose();
        console.log("end!");
        break;
      }
    }
  }

  dispose() {
    this.tail.geometry.dispose();
    (this.tail.material as THREE.Material).dispose();
    this.explosion?.dispose();
  }
}

export class Explosion extends THREE.Points<
  THREE.BufferGeometry,
  THREE.ShaderMaterial
> {
  private elapsed = 0;

  /**
   * @param particleCount count of particles.
   * @param duration s
   */
  constructor(particleCount = 200, readonly duration = 1, readonly speed = 5) {
    const geometry = new BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = 0;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = 0;

      const dir = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ).setLength(speed);

      velocities[i3] = dir.x;
      velocities[i3 + 1] = dir.y;
      velocities[i3 + 2] = dir.z;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("velocity", new THREE.BufferAttribute(velocities, 3));

    const material = new ShaderMaterial({
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      uniforms: {
        u_time: { value: 0 },
        u_dur: { value: duration },
      },
      vertexShader: `
      attribute vec3 direction;
      attribute vec3 velocity;

      uniform float u_dur;
      uniform float u_time;

        void main() {
          vec3 newPosition = position + velocity * u_time;
          gl_PointSize = 10.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform float u_dur;
        uniform float u_time;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          float alpha = 1.0 - u_time / u_dur;
          gl_FragColor = vec4(1.0, 0.6, 0.2, alpha);
        }
      `,
    });

    super(geometry, material);
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }

  update(delta: number) {
    this.elapsed += delta * 0.2;

    if (this.elapsed >= this.duration) {
      return false;
    }

    const velocities = this.geometry.attributes.velocity;

    for (let i = 0; i < velocities.count; i += 1) {
      velocities[i * 3 + 1] -= 3 * delta;
    }

    velocities.needsUpdate = true;
    this.material.uniforms.u_time.value = this.elapsed;
    return true;
  }
}
