module.exports = function streamToString(stream, callback) {
  callback = callback || function () {};

  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('error', (err) => {
      console.error(err);
      reject(err);
      return callback(err);
    });
    stream.on('data', (chunk) => {
      chunks.push(chunk);
    });
    stream.on('end', () => {
      var result = chunks.join('');
      resolve(result);
      return callback(null, result);
    });
  });
};
