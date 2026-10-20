// Type surface for the unmodified Scroll Craft engine (scrollcraft.js).
export interface ScrollCraftInstance {
  layout(): void;
  read(): void;
  destroy(): void;
}
declare global {
  interface Window {
    ScrollCraft?: {
      mount(root?: Element | Document | string, opts?: { lerp?: number }): ScrollCraftInstance;
      reduce: boolean;
      instances: ScrollCraftInstance[];
    };
  }
}
