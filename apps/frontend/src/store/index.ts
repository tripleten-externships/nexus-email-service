export { StoreProvider } from './StoreProvider';
export { useStore } from './useStore';
export { rootStore } from './RootStore';
export type { RootStore } from './RootStore';

import { MainStore } from './MainStore';
export const mainStore = new MainStore();
