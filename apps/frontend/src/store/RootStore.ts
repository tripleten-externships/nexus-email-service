import { makeAutoObservable } from 'mobx';
import { MainStore } from './MainStore';

export class RootStore {
  mainStore: MainStore;

  constructor() {
    this.mainStore = new MainStore();
    makeAutoObservable(this);
  }
}

// Create a single instance of the store
export const rootStore = new RootStore();
