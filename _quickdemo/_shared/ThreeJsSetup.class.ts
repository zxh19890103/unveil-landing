import * as THREE from "three";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MapControls } from "three/addons/controls/MapControls.js";
import Stats from "three/addons/libs/stats.module.js";

/**
 * Interface to define the options for adding a WebGLRenderer.
 */
interface WebGLRendererOptions {
  zIndex?: number;
  antialias?: boolean;
  alpha?: boolean;
  canvas?: HTMLCanvasElement;
  context?: WebGLRenderingContext;
  preserveDrawingBuffer?: boolean;
  powerPreference?: "high-performance" | "low-power" | "default";
  stencil?: boolean;
  depth?: boolean;
  logarithmicDepthBuffer?: boolean;
  /**
   * If true, this renderer will be updated in the animation loop.
   * If false, you will need to call render() on it manually.
   * Default is true.
   */
  animated?: boolean;
}

/**
 * A class to set up and manage a Three.js scene, camera, and multiple renderers.
 */
export class ThreeJsSetup
  extends THREE.EventDispatcher<{
    viewportResize: any;
  }>
  implements WithActiveCamera
{
  private stats: Stats = new Stats();

  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public activeCamera: THREE.PerspectiveCamera;

  private webGLRenderers: Map<string, THREE.WebGLRenderer>;
  private animatedWebGLRenderers: Set<THREE.WebGLRenderer>;
  private css2DRenderer: CSS2DRenderer | null;
  private animationFrameId: number | null;
  private onAnimateCallbacks: ((delta: number, elapse: number) => void)[];
  private clock: THREE.Clock;
  private resizeObserver: ResizeObserver | null; // New: ResizeObserver instance
  private mainContainerElement: HTMLElement; // Store the main container
  public controls: THREE.Controls<{ change: any }>;

  /**
   * Creates an instance of ThreeJsSetup.
   * @param containerElement The HTMLElement to append the default renderer's DOM element to.
   * This element will also be observed for size changes.
   * @param fov Camera frustum vertical field of view. Default is 75.
   * @param near Camera frustum near plane. Default is 0.1.
   * @param far Camera frustum far plane. Default is 1000.
   */
  constructor(
    containerElement: HTMLElement,
    fov: number = 75,
    near: number = 0.1,
    far: number = 150
  ) {
    super();

    this.scene = new THREE.Scene();
    // Initialize camera with container's initial dimensions
    this.camera = new THREE.PerspectiveCamera(
      fov,
      containerElement.clientWidth / containerElement.clientHeight,
      near,
      far
    );

    this.camera.position.z = 5; // Initial camera position

    this.activeCamera = this.camera;

    this.webGLRenderers = new Map<string, THREE.WebGLRenderer>();
    this.animatedWebGLRenderers = new Set<THREE.WebGLRenderer>();
    this.css2DRenderer = null;
    this.animationFrameId = null;
    this.onAnimateCallbacks = [];
    this.clock = new THREE.Clock();
    this.resizeObserver = null;
    this.mainContainerElement = containerElement; // Store reference to the main container

    // Add a default WebGLRenderer, make it animated by default
    this.addWebGLRenderer("default", this.mainContainerElement, {
      animated: true,
      antialias: true,
      zIndex: 100,
    });

    // Set up ResizeObserver instead of window resize listener
    this.setupResizeObserver();

    console.log("ThreeJsSetup initialized:", {
      scene: this.scene,
      camera: this.camera,
    });

    this.stats.showPanel(0);
    document.body.appendChild(this.stats.dom);
  }

  public setupControls() {
    const controls = new OrbitControls(this.camera, this.mainContainerElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.update();
    // controls.autoRotate = true;
    this.controls = controls;
  }

  public enableControls() {
    if (this.controls) {
      this.controls.enabled = true;
    }
  }

  public disableControls() {
    if (this.controls) {
      this.controls.enabled = false;
    }
  }

  /**
   * Sets up the ResizeObserver to monitor the main container's dimensions.
   */
  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // Ensure we only react to the observed container
        if (entry.target === this.mainContainerElement) {
          const { width, height } = entry.contentRect;
          this.onContainerResize(width, height);
        }
      }
    });
    this.resizeObserver.observe(this.mainContainerElement);
    // console.log("ResizeObserver set up for main container.");
  }

  /**
   * Adds a WebGLRenderer to the setup.
   * @param name A unique name for the renderer.
   * @param containerElement The HTMLElement to append the renderer's DOM element to.
   * @param options Optional configuration for the WebGLRenderer, including 'animated' flag.
   * @returns The added WebGLRenderer instance.
   */
  public addWebGLRenderer(
    name: string,
    containerElement: HTMLElement,
    options?: WebGLRendererOptions
  ): THREE.WebGLRenderer {
    if (this.webGLRenderers.has(name)) {
      console.warn(
        `WebGLRenderer with name '${name}' already exists. Overwriting.`
      );
      const oldRenderer = this.webGLRenderers.get(name);
      if (oldRenderer) {
        this.animatedWebGLRenderers.delete(oldRenderer);
      }
    }

    const renderer = new THREE.WebGLRenderer(options);

    renderer.setClearColor(0xffffff);
    renderer.setClearAlpha(0);

    renderer.setPixelRatio(window.devicePixelRatio);
    // Set initial size based on the specific containerElement's dimensions
    renderer.setSize(
      containerElement.clientWidth,
      containerElement.clientHeight
    );

    renderer.domElement.classList.add(`threejs-renderer-${name}`);
    renderer.domElement.style.zIndex = options.zIndex + "";

    containerElement.appendChild(renderer.domElement);
    this.webGLRenderers.set(name, renderer);

    if (options?.animated === undefined || options.animated === true) {
      this.animatedWebGLRenderers.add(renderer);
    }

    console.log(
      `WebGLRenderer '${name}' added. Animated: ${
        options?.animated === undefined || options.animated
      }.`,
      renderer
    );
    return renderer;
  }

  public createWorld() {
    const scene = new THREE.Scene();
    return scene;
  }

  /**
   * Gets a WebGLRenderer by its name.
   * @param name The name of the renderer to retrieve.
   * @returns The WebGLRenderer instance or undefined if not found.
   */
  public getWebGLRenderer(name: string): THREE.WebGLRenderer | undefined {
    return this.webGLRenderers.get(name);
  }

  /**
   * Sets whether a specific WebGLRenderer should be animated by the main loop.
   * @param name The name of the renderer.
   * @param animated True to include in animation loop, false to exclude.
   * @returns True if the renderer was found and updated, false otherwise.
   */
  public setWebGLRendererAnimated(name: string, animated: boolean): boolean {
    const renderer = this.webGLRenderers.get(name);
    if (renderer) {
      if (animated) {
        this.animatedWebGLRenderers.add(renderer);
      } else {
        this.animatedWebGLRenderers.delete(renderer);
      }
      console.log(
        `WebGLRenderer '${name}' animation status set to: ${animated}.`
      );
      return true;
    }
    console.warn(`WebGLRenderer with name '${name}' not found.`);
    return false;
  }

  /**
   * Adds a CSS2DRenderer to the setup. Only one CSS2DRenderer can exist.
   * By default, the CSS2DRenderer will always be animated (rendered in the loop)
   * as its primary purpose is usually to follow dynamic 3D elements.
   * @param containerElement The HTMLElement to append the renderer's DOM element to.
   * Note: This container needs to be the same element that the WebGL renderer
   * is appended to, or an element overlaid on top, with proper positioning.
   * @returns The added CSS2DRenderer instance.
   */
  public addCSS2DRenderer(
    containerElement: HTMLElement = this.mainContainerElement
  ): CSS2DRenderer {
    if (this.css2DRenderer) {
      console.warn(
        "CSS2DRenderer already exists. Returning existing instance."
      );
      return this.css2DRenderer;
    }
    this.css2DRenderer = new CSS2DRenderer();
    this.css2DRenderer.setSize(
      containerElement.clientWidth,
      containerElement.clientHeight
    );
    this.css2DRenderer.domElement.style.position = "absolute";
    this.css2DRenderer.domElement.style.top = "0px";
    this.css2DRenderer.domElement.style.zIndex = 120 + "";
    this.css2DRenderer.domElement.style.pointerEvents = "none"; // Allow clicking through
    this.mainContainerElement;
    containerElement.appendChild(this.css2DRenderer.domElement);
    console.log("CSS2DRenderer added. It will be animated in the loop.");
    return this.css2DRenderer;
  }

  /**
   * Gets the CSS2DRenderer instance.
   * @returns The CSS2DRenderer instance or null if not added.
   */
  public getCSS2DRenderer(): CSS2DRenderer | null {
    return this.css2DRenderer;
  }

  /**
   * Handles container resize events from ResizeObserver.
   * Adjusts camera aspect ratio and renderer sizes for ALL renderers
   * based on the main container's new dimensions.
   * @param width The new width of the container.
   * @param height The new height of the container.
   */
  private onContainerResize(width: number, height: number): void {
    // Ensure width and height are positive to prevent errors
    if (width <= 0 || height <= 0) {
      console.warn(
        "Container size is zero or negative, skipping resize update."
      );
      return;
    }

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    // Resize ALL WebGL renderers
    this.webGLRenderers.forEach((renderer) => {
      // Note: If you have renderers attached to *different* containers,
      // you'd need a separate ResizeObserver for each, or manage their sizes
      // based on their own parent elements. For simplicity here, we assume
      // all renderers primarily scale with the main container.
      // If a renderer is in a sub-container, you should set its size to that sub-container's
      // width/height, not the main container's.
      // A more robust solution might involve storing the parentElement for each renderer
      // and using its clientWidth/clientHeight.
      renderer.setSize(width, height);
    });

    if (this.css2DRenderer) {
      this.css2DRenderer.setSize(width, height);
    }

    this.dispatchEvent({ type: "viewportResize" });
  }

  /**
   * Registers a callback function to be executed in the animation loop.
   * @param callback The function to call on each animation frame. It receives `delta` time as an argument.
   */
  public onAnimate(callback: (delta: number, elapse: number) => void): void {
    this.onAnimateCallbacks.push(callback);
  }

  /**
   * The main animation loop.
   * It renders ONLY the animated WebGLRenderers and the CSS2DRenderer (if present).
   * Also executes registered animation callbacks.
   */
  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    this.stats.begin();

    const delta = this.clock.getDelta();
    const eplased = this.clock.getElapsedTime();

    // Execute all registered animation callbacks
    this.onAnimateCallbacks.forEach((callback) => callback(delta, eplased));

    // Render ONLY the animated WebGL renderers
    this.animatedWebGLRenderers.forEach((renderer) => {
      renderer.render(this.scene, this.activeCamera);
    });

    // Render CSS2DRenderer if present
    if (this.css2DRenderer) {
      this.css2DRenderer.render(this.scene, this.activeCamera);
    }

    this.controls?.update(delta);

    this.stats.end();
  };

  /**
   * Starts the animation loop.
   */
  public startAnimation(): void {
    if (!this.animationFrameId) {
      this.clock.start();
      this.animate();
      console.log("Animation loop started.");
    } else {
      console.warn("Animation loop is already running.");
    }
  }

  /**
   * Stops the animation loop.
   */
  public stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
      this.clock.stop();
      console.log("Animation loop stopped.");
    } else {
      console.warn("Animation loop is not running.");
    }
  }

  /**
   * Disposes of all Three.js resources and removes event listeners.
   * Call this when the ThreeJsSetup instance is no longer needed to prevent memory leaks.
   */
  public dispose(): void {
    this.stopAnimation();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect(); // Disconnect the observer
      this.resizeObserver = null;
      console.log("ResizeObserver disconnected.");
    }

    // Dispose WebGL Renderers
    this.webGLRenderers.forEach((renderer) => {
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      console.log(`WebGLRenderer disposed.`);
    });
    this.webGLRenderers.clear();
    this.animatedWebGLRenderers.clear();

    // Dispose CSS2D Renderer
    if (this.css2DRenderer) {
      if (this.css2DRenderer.domElement.parentNode) {
        this.css2DRenderer.domElement.parentNode.removeChild(
          this.css2DRenderer.domElement
        );
      }
      this.css2DRenderer = null;
      console.log("CSS2DRenderer disposed.");
    }

    console.log("ThreeJsSetup disposed successfully.");
  }
}
