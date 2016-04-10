# Mathspeak

A library for constructing math to speech translators.

##### > npm install

* Installs dependencies.

##### > npm run build

* Compiles source files (in ES2015) to a node compatible library (in ES5).
* Creates a browser compatible bundle.

##### > npm run test

* Runs tests.

##### Embedding API

Call the Mathspeak evaluator with a global options object constructed with Graffiticode L115 (e.g.  http://www.graffiticode.com/item?id=80526+38905) and an object containing the LaTeX to translate and parsing settings.

[NOTE: you can use the JSON objects in ./tests/data for the global options (e.g. gc80526.json)]


Here is a example embedding:

    function run(options, obj) {
      // obj -- {settings, src}
      // opts -- object containing words and rules authored in http://www.graffiticode.com/L115 (e.g. ./tests/data/gc80526.json)
      let src = opt.src;
      options = Object.assign({}, options, obj.settings);  // Merge item options into global options.
      Core.translate(options, src, function (err, result) {
        // Receive result
      });
    }

(See ./tests/test.js for another example.)
