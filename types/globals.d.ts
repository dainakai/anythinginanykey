// types/globals.d.ts
import type abcjs from 'abcjs';

declare global {
  interface Window {
    ABCJS: typeof abcjs; // Declare ABCJS property on the window object
  }
}

// Export {} to make this file a module
export {};
