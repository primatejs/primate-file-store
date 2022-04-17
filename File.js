import {Storeable, File} from "primate";

export default class extends Storeable {
  constructor(...args) {
    super();
    return new File(...args);
  }

  static get instance() {
    return File;
  }

  static type_error() {
    return "Must be a file";
  }

  static is(value) {
    return value instanceof this.instance;
  }

  static deserialize(value) {
    return value instanceof this.instance ? value : new this.instance(value);
  }
}
