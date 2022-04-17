# Primate file store

This store module facades file-system operations, allowing you to work with
files.

## Installing

```
npm install primate-file-store
```

## Using

Import the module and instance a store with `path` (path to directory).

```js
import FileStore from "primate-file-store";
export default new FileStore({"path": "/tmp/file-store"});
```

A collection in this store is a directory within the path and documents are
represented by subdirectories. Fields are each saved as files, with `File` types
streamed out and mirroring the ending of the original file, while all other
fields are stored as text files with no ending.

## License

BSD-3-Clause
