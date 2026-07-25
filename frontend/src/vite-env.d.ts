/// <reference types="vite/client" />

declare module '*.jpg';
declare module '*.png';
declare module '*.jpeg';
declare module '*.webp';
declare module '*.svg';

interface ImportMetaEnv {
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
  // add any other VITE_* vars you use here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}