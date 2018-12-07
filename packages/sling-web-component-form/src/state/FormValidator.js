import { isFunction } from 'sling-helpers';

const FORM_LEVEL = '__FORM_LEVEL__';

export class FormValidator {
  constructor() {
    this.pending = {};
    this.isValidatingLevel = {};
  }

  get isValidating() {
    return Object.values(this.isValidatingLevel).some(val => val === true);
  }

  validate(validatorThunk, path = FORM_LEVEL) {
    if (isFunction(this.onValidationStart)) {
      this.onValidationStart({
        isValidating: this.isValidating,
      });
    }

    this.queue(validatorThunk, path);
    this.executeNext(path);
  }

  queue(validatorThunk, path) {
    this.pending[path] = this.pending[path] || [];
    this.pending[path].push(validatorThunk);
  }

  async executeNext(path, levelError = {}) {
    if (!this.isValidatingLevel[path]) {
      if (this.pending[path].length > 0) {
        this.isValidatingLevel[path] = true;
        const nextValidatorThunk = this.pending[path].pop();
        this.pending[path] = [];
        const nextLevelErrors = await nextValidatorThunk();
        this.isValidatingLevel[path] = false;
        this.executeNext(path, nextLevelErrors);
      } else if (isFunction(this.onValidationComplete)) {
        this.onValidationComplete({
          error: levelError,
          path: (path === FORM_LEVEL) ? undefined : path,
          isValidating: this.isValidating,
        });
      }
    }
  }
}
