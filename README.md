# Spokenmath

A library for constructing math to speech translators.

##### > npm install

* Installs dependencies.

##### > npm run build

* Compiles source files (in ES2015) to a node compatible library (in ES5).
* Creates a browser compatible bundle.

##### > npm run test

* Runs tests.

##### Embedding API

Call the Spokenmath evaluator with a global options object constructed with Graffiticode L115 (e.g.  http://www.graffiticode.com/item?id=80526+38905) and an object containing the LaTeX to translate and parsing settings.

[NOTE: you can use the JSON objects in ./tests/data for the global options (e.g. gc80526.json)]


Here is an example embedding:

    function run(opts, obj) {
      // opts -- object containing words and rules authored in http://www.graffiticode.com/L115 (./tests/data/gc80526.json).
      //         If !opt === true, then Spokenmath Core.translate will provide a default set of rules.
      // obj -- {settings, src}
      let src = obj.src;
      let options = Object.assign({}, opts, obj.settings);  // Merge item options into global options.
      Core.translate(options, src, function (err, result) {
        // Receive result
      });
    }

(See ./tests/test.js for another example.)
