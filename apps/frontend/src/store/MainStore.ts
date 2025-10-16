import { makeAutoObservable } from 'mobx';

export class MainStore {
  count = 0;

  constructor() {
    makeAutoObservable(this);
  }

  increment() {
    this.count += 1;
  }

  get currentCount() {
    return this.count;
  }
}
