import fs from "fs";
import {Core} from "../lib/core.js";
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
  let evaluator = Core.makeEvaluator({
    method: "translate",
    options: test.options,
  });
  let passCount = 0, failCount = 0;
  let t0 = Date.now();
  console.log("Starting " + fname);
  test.tests.forEach(t => {
    evaluator.evaluate(t[0], function (err, val) {
      if (err && err.length) {
        errs = errs.concat(error(err));
      }
      let result;
      if (trim(t[1]) === trim(val)) {
        result = "PASS";
        passCount++;
      } else {
        result = "FAIL";
        failCount++;
      }
      console.log(result + ": " + t + " | " + JSON.stringify(val));
    });
  });
  console.log("Test completed in " + (Date.now() - t0) + " ms");
  console.log(passCount + " PASSED, " + failCount + " FAILED");
}
run("./tests/data/gc57354.json");
run("./tests/data/gc57355.json");
