import {File, Store} from "primate";

const not_found = -1;

export default class FileStore extends Store {
  async use(collection) {
    // a collection is a subdirectory within path, and it cannot be lazily
    // created, at least not until File supports creating its path lazily
    const directory = await new File(`${this.path}/${collection}`);
    if (!directory.exists) {
      await directory.create();
    }
    return `${this.path}/${collection}`;
  }

  async deserialize(collection, _id) {
    const using = await this.use(collection);
    const path = `${using}/${_id}`;
    const directory = await new File(path);

    if (directory.exists) {
      return (await directory.list()).reduce(async (promise, file) => {
        const document = await promise;
        const index = file.lastIndexOf(".");
        if (index === not_found) {
          document[file] = await File.read(path, file);
        } else {
          document[file.slice(0, index)] = await new File(path, file);
        }
        return document;
      }, {});
    }
    return undefined;
  }

  async find_in_document(collection, criteria, _id) {
    const using = await this.use(collection);
    const path = `${using}/${_id}`;
    const file = await new File(path);
    const fields = await file.list();
    const keys = Object.keys(criteria);

    const found = await keys.reduce(async (sofar, criterium) =>
      sofar && await File.read(`${path}/${criterium}`) === criteria[criterium],
    !keys.some(criterium => !fields.includes(criterium)));
    return found ? this.deserialize(collection, _id) : undefined;
  }

  async find(collection, criteria = {}) {
    const using = await this.use(collection);
    if (criteria._id !== undefined) {
      return [await this.one(collection, criteria._id)];
    }
    return (await Promise.all(
      await new File(using).list().map(document =>
        this.find_in_document(collection, criteria, document)
      ))).filter(result => result !== undefined);
  }

  one(collection, _id) {
    return this.deserialize(collection, _id);
  }

  // The nature of a file path ensures that there are no duplicates as far as
  // the _id is concerned
  async count(collection) {
    await this.use(collection);
    return true;
  }

  async insert(collection, criteria, document) {
    const using = await this.use(collection);
    const {_id} = document;
    const document_directory = await new File(`${using}/${_id}`);

    if (!document_directory.exists) {
      await document_directory.create();
    }
    const keys = Object.keys(document);
    await Promise.all(keys
      .filter(key => key !== "_id")
      .map(async key => {
        const value = document[key];
        const filename = `${using}/${_id}/${key}`;
        if (value instanceof File) {
          const {path, read_stream} = value;
          const ending = path.slice(path.lastIndexOf(".")+1);
          const file = await new File(`${filename}.${ending}`);
          read_stream.pipe(file.write_stream);
        } else {
          const file = await new File(`${filename}`);
          await file.write(value);
        }
      })
    );
    return document;
  }

  async delete(collection, {_id}) {
    const file = await new File(`${await this.use(collection)}/${_id}`);
    try {
      await file.remove();
    } catch (error) {
      // this has no real equivalence in non-binary databases
    }
  }

  // is replace
  async save(collection, criteria, document) {
    await this.delete(collection, criteria);
    return this.insert(collection, criteria, document);
  }
}
