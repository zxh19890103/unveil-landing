import * as THREE from "three";

export class Missile {
  private scene: THREE.Scene;
  private curve: THREE.QuadraticBezierCurve3;
  private missile: THREE.Mesh;
  private tail: THREE.Mesh;
  private explosionParticles: THREE.Points | null = null;

  private t: number = 0;
  private exploded = false;
  private speed: number;
  private lifespan = 1;

  constructor(
    scene: THREE.Scene,
    from: THREE.Vector3,
    to: THREE.Vector3,
    options?: {
      midHeight?: number;
      speed?: number;
      missileColor?: THREE.ColorRepresentation;
      tailColor?: THREE.ColorRepresentation;
    }
  ) {
    this.scene = scene;
    const {
      midHeight = 10,
      speed = 0.5,
      missileColor = 0xff0000,
      tailColor = 0xffaa00,
    } = options || {};
    this.speed = speed;

    const mid = from
      .clone()
      .add(to)
      .multiplyScalar(0.5)
      .add(new THREE.Vector3(0, midHeight, 0));
    this.curve = new THREE.QuadraticBezierCurve3(from, mid, to);

    // Missile body
    this.missile = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 16, 16),
      new THREE.MeshBasicMaterial({ color: missileColor })
    );
    this.scene.add(this.missile);

    // Tail
    const tailGeom = new THREE.TubeGeometry(this.curve, 50, 0.05, 6, false);
    const tailMat = new THREE.MeshBasicMaterial({
      color: tailColor,
      transparent: true,
      opacity: 0.5,
    });
    this.tail = new THREE.Mesh(tailGeom, tailMat);
    this.scene.add(this.tail);
  }

  update(deltaTime: number) {
    if (this.exploded) {
      this.updateExplosion(deltaTime);
      return;
    }

    this.t += deltaTime * this.speed;
    if (this.t >= 1) {
      this.explode();
      return;
    }

    const pos = this.curve.getPoint(this.t);
    this.missile.position.copy(pos);
  }

  private explode() {
    this.exploded = true;
    this.scene.remove(this.missile);
    this.scene.remove(this.tail);
    this.createExplosionParticles(this.curve.getPoint(1));
  }

  private createExplosionParticles(center: THREE.Vector3) {
    const particleCount = 300;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      const dx = Math.cos(angle) * speed;
      const dy = Math.random() * 2;
      const dz = Math.sin(angle) * speed;

      positions[i * 3 + 0] = center.x;
      positions[i * 3 + 1] = center.y;
      positions[i * 3 + 2] = center.z;

      velocities[i * 3 + 0] = dx;
      velocities[i * 3 + 1] = dy;
      velocities[i * 3 + 2] = dz;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("velocity", new THREE.BufferAttribute(velocities, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffff00,
      sizeAttenuation: false,
      size: 2,
      transparent: true,
      opacity: 1,
    });

    this.explosionParticles = new THREE.Points(geometry, material);
    this.scene.add(this.explosionParticles);
  }

  private updateExplosion(deltaTime: number) {
    if (!this.explosionParticles) return;

    const posAttr = this.explosionParticles.geometry.getAttribute(
      "position"
    ) as THREE.BufferAttribute;
    const velAttr = this.explosionParticles.geometry.getAttribute(
      "velocity"
    ) as THREE.BufferAttribute;

    for (let i = 0; i < posAttr.count; i++) {
      posAttr.array[i * 3 + 0] += velAttr.array[i * 3 + 0] * deltaTime;
      posAttr.array[i * 3 + 1] += velAttr.array[i * 3 + 1] * deltaTime;
      posAttr.array[i * 3 + 2] += velAttr.array[i * 3 + 2] * deltaTime;
    }

    posAttr.needsUpdate = true;

    // 漸變消失
    const mat = this.explosionParticles.material as THREE.PointsMaterial;
    mat.opacity -= deltaTime * 1;
    if (mat.opacity <= 0) {
      this.scene.remove(this.explosionParticles);
      this.explosionParticles = null;
    }
  }

  isDone(): boolean {
    return this.exploded && this.explosionParticles === null;
  }
}
