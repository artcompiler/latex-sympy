import fs from "fs";
import {Core} from "../build/spokenmath.js";
function trim(str) {
  let i = 0;
  let out = "";
  for (; i < str.length; i++) {
    switch (str.charAt(i)) {
    case " ":
    case "\t":
    case "\n":
      if (out.length === 0 || out.charAt(out.length-1) === " ") {
        // Erase space at beginning and after other space.
        continue;
      }
      out += " ";
      break;
    default:
      out += str.charAt(i);
      break;
    }
  }
  while (out.charAt(out.length - 1) === " ") {
    // Trim off trailing whitespace.
    out = out.substring(0, out.length - 1);
  }
  return out;
}
function run(fname) {
  var test = JSON.parse(fs.readFileSync(fname, "utf8"));
  let passCount = 0, failCount = 0;
  let t0 = Date.now();
  console.log("Starting " + fname);
  test.tests.forEach(t => {
    let src = t instanceof Array ? t[0] : t.source;
    let expected = t instanceof Array ? t[1] : t.expected;
    let options;
    if (t.options) {
      // Add item options to global options.
      options = Object.assign({}, test.options, t.options);
    } else {
      options = test.options;
    }
    Core.translate(options, src, function (err, val) {
      let result;
      if (trim(expected) === trim(val)) {
        result = "PASS";
        passCount++;
      } else {
        result = "FAIL";
        failCount++;
      }
      console.log(result + ": " + src + " | " + JSON.stringify(val));
    });
  });
  console.log("Test completed in " + (Date.now() - t0) + " ms");
  console.log(passCount + " PASSED, " + failCount + " FAILED");
}
run("./tests/data/default.json");
