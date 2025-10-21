type UserInteractionCallback = (active: boolean) => void;

export class UserInteractionDetector {
  private timeout: number;
  private lastInteraction: number;
  private active: boolean;
  private intervalId?: number;
  private callback?: UserInteractionCallback;

  constructor(timeout: number = 60000, callback?: UserInteractionCallback) {
    this.timeout = timeout;
    this.lastInteraction = Date.now();
    this.active = true;
    this.callback = callback;

    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "pointermove",
      "focus",
      "wheel",
    ];

    events.forEach((event) =>
      window.addEventListener(event, this.update, { passive: true })
    );

    document.addEventListener("visibilitychange", this.handleVisibility);

    this.callback?.(true);

    this.intervalId = window.setInterval(this.checkIdle, 5000);
  }

  private update = () => {
    this.lastInteraction = Date.now();
    if (!this.active) {
      this.active = true;
      console.log("🟢 User active again");
      this.callback?.(true);
    }
  };

  private handleVisibility = () => {
    if (document.hidden) {
      this.active = false;
      console.log("🔴 User left the page or minimized");
      this.callback?.(false);
    } else {
      this.update();
    }
  };

  private checkIdle = () => {
    if (Date.now() - this.lastInteraction > this.timeout && this.active) {
      this.active = false;
      console.log("🔴 User idle");
      this.callback?.(false);
    }
  };

  public stop() {
    document.removeEventListener("visibilitychange", this.handleVisibility);
    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "pointermove",
      "focus",
      "wheel"
    ];
    events.forEach((event) => window.removeEventListener(event, this.update));
    if (this.intervalId) clearInterval(this.intervalId);
  }

  public isActive() {
    return this.active;
  }
}
