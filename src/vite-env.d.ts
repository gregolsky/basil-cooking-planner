/// <reference types="vite/client" />

// open-props ships CSS-only submodules (e.g. 'open-props/sizes') with no .css
// suffix on the specifier, so vite/client's `declare module '*.css'` doesn't
// match. This covers the side-effect imports in src/main.tsx.
declare module 'open-props/*';
