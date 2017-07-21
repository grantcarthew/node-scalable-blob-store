# scalable-blob-store Work Log

## Tests

*   The module `mock-fs` is not mocking the file system. When I run the tests a `/tmp/blobs` directory is created.
*   There is a bug in the bulk tests.
*   Currently most of the tests are commented out in the `test-runner.js` file.