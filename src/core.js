/*
 * Copyright 2016 Art Compiler LLC. All Rights Reserved.
 *
 */
import {every, forEach, keys, indexOf} from "./backward.js";
import {Assert, assert, message} from "./assert.js";
import {Ast} from "./ast.js";
import {Model} from "./model.js";

(function (ast) {

  let messages = Assert.messages;

  function newNode(op, args) {
    return {
      op: op,
      args: args
    };
  }

  // The outer Visitor function provides a global scope for all visitors,
  // as well as dispatching to methods within a visitor.
  function Visitor(ast) {
    function visit(node, visit, resume) {
      assert(node.op && node.args, "Visitor.visit() op=" + node.op + " args = " + node.args);
      switch (node.op) {
      case Model.NUM:
        node = visit.numeric(node, resume);
        break;
      case Model.ADD:
      case Model.SUB:
      case Model.PM:
      case Model.BACKSLASH: // set operator
      case Model.MUL:
      case Model.DIV:
      case Model.FRAC:
      case Model.LOG:
      case Model.COLON:
        if (node.args.length === 1) {
          node = visit.unary(node, resume);
        } else {
          node = visit.binary(node, resume);
        }
        break;
      case Model.POW:
        node = visit.exponent(node, resume);
        break;
      case Model.VAR:
      case Model.SUBSCRIPT:
        node = visit.variable(node, resume);
        break;
      case Model.SQRT:
      case Model.SIN:
      case Model.COS:
      case Model.TAN:
      case Model.ARCSIN:
      case Model.ARCCOS:
      case Model.ARCTAN:
      case Model.SEC:
      case Model.CSC:
      case Model.COT:
      case Model.PERCENT:
      case Model.M:
      case Model.ABS:
      case Model.FACT:
      case Model.FORALL:
      case Model.EXISTS:
      case Model.IN:
      case Model.SUM:
      case Model.LIM:
      case Model.EXP:
      case Model.TO:
      case Model.INT:
      case Model.PROD:
      case Model.ION:
      case Model.POW:
      case Model.SUBSCRIPT:
      case Model.OVERLINE:
      case Model.OVERSET:
      case Model.UNDERSET:
      case Model.NONE:
      case Model.DEGREE:
      case Model.DOT:
      case Model.SET:
        node = visit.unary(node, resume);
        break;
      case Model.COMMA:
      case Model.MATRIX:
      case Model.VEC:
      case Model.ROW:
      case Model.COL:
      case Model.INTERVAL:
      case Model.LIST:
        node = visit.comma(node, resume);
        break;
      case Model.EQL:
      case Model.LT:
      case Model.LE:
      case Model.GT:
      case Model.GE:
      case Model.NE:
      case Model.APPROX:
      case Model.RIGHTARROW:
        node = visit.equals(node, resume);
        break;
      case Model.PAREN:
        node = visit.paren(node);
        break;
      default:
        if (visit.name !== "normalizeLiteral" &&
            visit.name !== "sort") {
          node = newNode(Model.VAR, ["INTERNAL ERROR Should not get here. Unhandled node operator " + node.op]);
        }
        break;
      }
      return node;
    }

    function lookup(word) {
      let words = Model.option("words");
      let val;
      if (words) {
        val = words[word];
      }
      if (!val) {
        val = word;
        if (val.charAt(0) === "\\") {
          val = val.substring(1);
        }
        if (val.indexOf(".") >= 0) {
          let i = val.indexOf(".");
          val = val.substring(0, i) + " point " + val.substring(i+1);
        }
      }
      return val;
    }

    function matchWildcard(rule, node) {
      if (rule.op === Model.COLON &&
          rule.args[0].op === Model.VAR && rule.args[0].args[0] === "?") {
        assert(rule.args[1].op === Model.VAR);
        switch (rule.args[1].args[0]) {
        case "N":
          return node.op === Model.NUM;
        default:
          return false;
        }
      }
      return (
        rule.op === Model.VAR && rule.args[0] === "?" ||
        rule.op === Model.MATRIX && node.op === Model.MATRIX
      );
    }

    // ["? + ?", "? - ?"], "1 + 2"
    function match(rules, node) {
      let matches = rules.filter(function (rule) {
        if (rule.op === undefined || node.op === undefined) {
          return false;
        }
        if (matchWildcard(rule, node) ||
           ast.intern(rule) === ast.intern(node)) {
          return true;
        }
        return (
          rule.op === node.op &&
          rule.args.length === node.args.length &&
          rule.args.every(function (arg, i) {
            let result = match([arg], node.args[i]);
            return result.length === 1;
          })
        );
      });
      return matches;
    }

    function expand(str, args) {
      if (str && args) {
        forEach(args, function (arg, i) {
          str = str.replace("%" + (i + 1), arg.args[0]);
        });
        return {
          op: Model.VAR,
          args: [str],
        };
      }
      return "ERROR expand(): Unknown str " + str;
    };

    function getPrec(op) {
      switch (op) {
      case Model.OR:
        return 1;
      case Model.AND:
        return 2;
      case Model.EQ:
      case Model.NE:
        return 3;
      case Model.LT:
      case Model.GT:
      case Model.LE:
      case Model.GE:
        return 4;
      case Model.ADD:
      case Model.SUB:
      case Model.PM:
        return 5;
      case Model.MUL:
      case Model.FRAC:
      case Model.DIV:
      case Model.MOD:
      case Model.COLON:
        return 6;
      case Model.POW:
      case Model.LOG:
      default:
        return 7;
      }
      assert(false, "ERROR missing precedence for " + op);
    }

    function isLowerPrecedence(n0, n1) {
      // Is n1 lower precedence than n0?
      let p0 = getPrec(n0.op);
      let p1 = getPrec(n1.op);
      return p1 < p0;
    }

    function translate(root, patterns, patternsHash) {
      // Translate math from LaTeX to English.
      if (!root || !root.args) {
        assert(false, "Should not get here. Illformed node.");
        return 0;
      }
      return visit(root, {
        name: "translate",
        numeric: function(node) {
          let args = [{
            op: Model.VAR,
            args: [lookup(node.args[0])]
          }];
          let matches = match(patterns, node);
          if (matches.length === 0) {
            return node;
          }
          // Use first match for now.
          let pattern = patternsHash[ast.intern(matches[0])];
          return expand(pattern, args);
          // return {
          //   op: Model.VAR,
          //   args: [lookup(node.args[0])]
          // };
        },
        binary: function(node) {
          let args = [];
          forEach(node.args, function (n) {
            if (isLowerPrecedence(node, n)) {
              n = newNode(Model.PAREN, [n]);
            }
            args = args.concat(translate(n, patterns, patternsHash));
          });
          let matches = match(patterns, node);
          if (matches.length === 0) {
            return node;
          }
          // Use first match for now.
          let pattern = patternsHash[ast.intern(matches[0])];
          return expand(pattern, args);
        },
        unary: function(node) {
          let args = [];
          forEach(node.args, function (n) {
            if (isLowerPrecedence(node, n)) {
              n = newNode(Model.PAREN, [n]);
            }
            args = args.concat(translate(n, patterns, patternsHash));
          });
          let matches = match(patterns, node);
          if (matches.length === 0) {
            return node;
          }
          // Use first match for now.
          let pattern = patternsHash[ast.intern(matches[0])];
          return expand(pattern, args);
        },
        exponent: function(node) {
          let args = [];
          forEach(node.args, function (n) {
            if (isLowerPrecedence(node, n)) {
              n = newNode(Model.PAREN, [n]);
            }
            args = args.concat(translate(n, patterns, patternsHash));
          });
          let matches = match(patterns, node);
          if (matches.length === 0) {
            return node;
          }
          // Use first match for now.
          let pattern = patternsHash[ast.intern(matches[0])];
          return expand(pattern, args);
        },
        variable: function(node) {
          let str = "";
          forEach(node.args, function (n, i) {
            // This is a little bit of a hack to handle how subscripts are encoded
            // as compound variables.
            if (i > 0) {
              str += " sub ";
              let v = translate(n, patterns, patternsHash);
              str += v.args[0];
              str += " baseline ";
            } else {
              str += lookup(n);
            }
          });
          return {
            op: Model.VAR,
            args: [str]
          };
        },
        comma: function(node) {
          if (node.op === Model.MATRIX || node.op === Model.ROW || node.op === Model.COL) {
            let args = [];
            forEach(node.args, function (n) {
              if (isLowerPrecedence(node, n)) {
                n = newNode(Model.PAREN, [n]);
              }
              args = args.concat(translate(n, patterns, patternsHash));
            });
            let matches = match(patterns, node);
            if (matches.length === 0) {
              return node;
            }
            // Use first match for now.
            let pattern = patternsHash[ast.intern(matches[0])];
            return expand(pattern, args);
          } else {
            let str = "";
            forEach(node.args, function (n, i) {
              let v = translate(n, patterns, patternsHash);
              if (i > 0) {
                str += " comma ";
              }
              str += v.args[0];
            });
            return {
              op: Model.VAR,
              args: [str],
            };
          }
        },
        equals: function(node) {
          let args = [];
          forEach(node.args, function (n) {
            args = args.concat(translate(n, patterns, patternsHash));
          });
          let matches = match(patterns, node);
          if (matches.length === 0) {
            return node;
          }
          // Use first match for now.
          let pattern = patternsHash[ast.intern(matches[0])];
          return expand(pattern, args);
        },
        paren: function(node) {
          assert (node.args.length === 1);
          node = translate(node.args[0], patterns, patternsHash);
          return node;
        }
      });
    }

    this.translate = translate;
  }

  function translate(node) {
    let ast = new Ast;
    let visitor = new Visitor(ast);
    let rules = Model.option("rules");
    let keys = Object.keys(rules);
    let patterns = [];
    let patternsHash = {};
    keys.forEach(function (key) {
      let node = Model.create(key);
      patterns.push(node);
      let hash = ast.intern(node);
      patternsHash[hash] = rules[key];
    });
    return visitor.translate(node, patterns, patternsHash);
  }
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
    while (out.lastIndexOf(" baseline") === out.length - " baseline".length) {
      // Trim off trailing modifiers
      out = out.substring(0, out.length - " baseline".length);
    }
    return out;
  }
  Model.fn.translate = function (n1) {
    let n = translate(n1);
    if (!n || n.op !== Model.VAR) {
      n = newNode(Model.VAR, ["ERROR missing rule: " + JSON.stringify(n1, null, 2)]);
    }
    return trim(n.args[0]);
  }

  let option = Model.option = function option(p, v) {
    let options = Model.options;
    let opt = options && options[p];
    if (v !== undefined) {
      // Set the option value.
      Model.options = options = options ? options : {};
      options[p] = v;
    }
    if (opt === undefined) {
      switch (p) {
      case "field":
        opt = "integer";
        break;
      case "decimalPlaces":
        opt = 10;
        break;
      case "setThousandsSeparator":
      case "setDecimalSeparator":
      case "dontExpandPowers":
      case "dontFactorDenominators":
      case "dontFactorTerms":
      case "dontConvertDecimalToFraction":
      case "strict":
        opt = undefined;
        break;
      default:
        opt = false;
        break;
      }
    }
    // Return the original or default option.
    return opt;
  }

  let RUN_SELF_TESTS = false;
  if (RUN_SELF_TESTS) {
    let env = {
    };

    trace("\nMath Model self testing");
    (function () {
    })();
  }
})(new Ast);
export let Core = (function () {
  Assert.reserveCodeRange(3000, 3999, "core");
  let messages = Assert.messages;
  let message = Assert.message;
  let assert = Assert.assert;
  messages[3001] = "No Math Core spec provided.";
  messages[3002] = "No Math Core solution provided.";
  messages[3003] = "No Math Core spec value provided.";
  messages[3004] = "Invalid Math Core spec method '%1'.";
  messages[3005] = "Operation taking too long.";
  messages[3006] = "Invalid option name '%1'.";
  messages[3007] = "Invalid option value '%2' for option '%1'.";
  messages[3008] = "Internal error: %1";

  let u = 1;
  let k = 1000;
  let c = Math.pow(10, -2);
  let m = Math.pow(10, -3);
  let mu = Math.pow(10, -6); // micro, \\mu
  let n = Math.pow(10, -9);
  let env = {
    "g": { type: "unit", value: u, base: "g" },
    "s": { type: "unit", value: u, base: "s" },
    "m": { type: "unit", value: u, base: "m" },
    "L": { type: "unit", value: u, base: "L" },
    "kg": { type: "unit", value: k, base: "g" },
    "km": { type: "unit", value: k, base: "m" },
    "ks": { type: "unit", value: k, base: "s" },
    "kL": { type: "unit", value: k, base: "L" },
    "cg": { type: "unit", value: c, base: "g" },
    "cm": { type: "unit", value: c, base: "m" },
    "cs": { type: "unit", value: c, base: "s" },
    "cL": { type: "unit", value: c, base: "L" },
    "mg": { type: "unit", value: m, base: "g" },
    "mm": { type: "unit", value: m, base: "m" },
    "ms": { type: "unit", value: m, base: "s" },
    "mL": { type: "unit", value: m, base: "L" },
    "\\mug": { type: "unit", value: mu, base: "g" },
    "\\mus": { type: "unit", value: mu, base: "s" },
    "\\mum": { type: "unit", value: mu, base: "m" },
    "\\muL": { type: "unit", value: mu, base: "L" },
    "ng": { type: "unit", value: n, base: "g" },
    "nm": { type: "unit", value: n, base: "m" },
    "ns": { type: "unit", value: n, base: "s" },
    "nL": { type: "unit", value: n, base: "L" },
    "in": { type: "unit", value: 1 / 12, base: "ft" },
    "ft": { type: "unit", value: u, base: "ft" },
    "yd": { type: "unit", value: 3, base: "ft" },
    "mi": { type: "unit", value: 5280, base: "ft" },
    "fl": { type: "unit", value: 1, base: "fl" },  // fluid ounce
    "cup": { type: "unit", value: 8, base: "fl" },
    "pt": { type: "unit", value: 16, base: "fl" },
    "qt": { type: "unit", value: 32, base: "fl" },
    "gal": { type: "unit", value: 128, base: "fl" },
    "oz": { type: "unit", value: 1 / 16, base: "lb" },
    "lb": { type: "unit", value: 1, base: "lb" },
    "st": { type: "unit", value: 1 / 1614, base: "lb" },
    "qtr": { type: "unit", value: 28, base: "lb" },
    "cwt": { type: "unit", value: 112, base: "lb" },
    "t": { type: "unit", value: 2240, base: "lb" },
    "$": { type: "unit", value: u, base: "$" },
    "i": { type: "unit", value: null, base: "i" },
    "min": { type: "unit", value: 60, base: "s" },
    "hr": { type: "unit", value: 3600, base: "s" },
    "day": { type: "unit", value: 24*3600, base: "s" },
    "\\radian": { type: "unit", value: u, base: "radian" },
    "\\degree": { type: "unit", value: Math.PI / 180, base: "radian" },
    "\\degree K": { type: "unit", value: u, base: "\\degree K" },
    "\\degree C": { type: "unit", value: u, base: "\\degree C" },
    "\\degree F": { type: "unit", value: u, base: "\\degree F" },
    "R": { name: "reals" },   // special math symbol for real space
    "matrix": {},
    "pmatrix": {},
    "bmatrix": {},
    "Bmatrix": {},
    "vmatrix": {},
    "Vmatrix": {},
    "array": {},
    "\\alpha": { type: "var" },
    "\\beta": { type: "var" },
    "\\gamma": { type: "var" },
    "\\delta": { type: "var" },
    "\\epsilon": { type: "var" },
    "\\zeta": { type: "var" },
    "\\eta": { type: "var" },
    "\\theta": { type: "var" },
    "\\iota": { type: "var" },
    "\\kappa": { type: "var" },
    "\\lambda": { type: "var" },
    "\\mu": { type: "const", value: mu },
    "\\nu": { type: "var" },
    "\\xi": { type: "var" },
    "\\pi": { type: "const", value: Math.PI },
    "\\rho": { type: "var" },
    "\\sigma": { type: "var" },
    "\\tau": { type: "var" },
    "\\upsilon": { type: "var" },
    "\\phi": { type: "var" },
    "\\chi": { type: "var" },
    "\\psi": { type: "var" },
    "\\omega": { type: "var" }
  };

  function validateOption(p, v) {
    switch (p) {
    case "field":
      switch (v) {
      case void 0: // undefined means use default
      case "integer":
      case "real":
      case "complex":
        break;
      default:
        assert(false, message(3007, [p, v]));
        break;
      }
      break;
    case "decimalPlaces":
      if (v === void 0 || +v >= 0 && +v <= 20) {
        break;
      }
      assert(false, message(3007, [p, v]));
      break;
    case "allowDecimal":
    case "allowInterval":
    case "dontExpandPowers":
    case "dontFactorDenominators":
    case "dontFactorTerms":
    case "dontConvertDecimalToFraction":
    case "dontSimplifyImaginary":
    case "ignoreOrder":
    case "inverseResult":
    case "requireThousandsSeparator":
    case "ignoreText":
    case "ignoreTrailingZeros":
    case "allowThousandsSeparator":
    case "compareSides":
    case "ignoreCoefficientOne":
    case "strict":
      if (typeof v === "undefined" || typeof v === "boolean") {
        break;
      }
      assert(false, message(3007, [p, v]));
      break;
    case "setThousandsSeparator":
      if (typeof v === "undefined" ||
          typeof v === "string" && v.length === 1 ||
          v instanceof Array) {
        break;
      }
      assert(false, message(3007, [p, v]));
      break;
    case "setDecimalSeparator":
      if (typeof v === "undefined" ||
          typeof v === "string" && v.length === 1 ||
          v instanceof Array && v.length > 0 && v[0].length === 1) {
        break;
      }
      assert(false, message(3007, [p, JSON.stringify(v)]));
      break;
    case "words":
    case "rules":
      if (typeof v === "undefined" ||
          typeof v === "object") {
        break;
      }
      assert(false, message(3007, [p, v]));
      break;
    default:
      assert(false, message(3006, [p]));
      break;
    }
    // If we get this far, all is well.
    return;
  }
  function validateOptions(options) {
    if (options) {
      forEach(keys(options), function (option) {
        validateOption(option, options[option]);
      });
    }
  }
  function evaluate(spec, solution, resume) {
    try {
      assert(spec, message(3001, [spec]));
      assert(solution != undefined, message(3002, [solution]));
      Assert.setCounter(1000000, message(3005));
      let evaluator = makeEvaluator(spec);
      evaluator.evaluate(solution, function (err, val) {
        resume(null, val);
      });
    } catch (e) {
      trace(e + "\n" + e.stack);
      resume(e.stack, undefined);
    }
  }
  function evaluateVerbose(spec, solution, resume) {
    let model;
    try {
      assert(spec, message(3001, [spec]));
      Assert.setCounter(1000000, message(3005));
      let evaluator = makeEvaluator(spec);
      let errorCode = 0, msg = "Normal completion", stack, location;
      evaluator.evaluate(solution, function (err, val) {
        resume([], {
          result: val,
          errorCode: errorCode,
          message: msg,
          stack: stack,
          location: location,
          toString: function () {
            return this.errorCode + ": (" + location + ") " + msg + "\n" + this.stack;
          }
        });
      });
    } catch (e) {
      if (!e.message) {
        try {
          // Internal error.
          assert(false, message(3008, [e]));
        } catch (x) {
          e = x;
        }
      }
      errorCode = parseErrorCode(e.message);
      msg = parseMessage(e.message);
      stack = e.stack;
      location = e.location;
      console.log("ERROR evaluateVerbose stack=" + stack);
      resume([e.stack], undefined);
    }
    function parseErrorCode(e) {
      let code = +e.slice(0, indexOf(e, ":"));
      if (!isNaN(code)) {
        return code;
      }
      return 0;
    }
    function parseMessage(e) {
      let code = parseErrorCode(e);
      if (code) {
        return e.slice(indexOf(e, ":")+2);
      }
      return e;
    }
  }
  function translate(spec, solution, resume) {
    let model;
    try {
      assert(spec, message(3001, [spec]));
      Assert.setCounter(1000000, message(3005));
      let evaluator = makeEvaluator(spec);
      let errorCode = 0, msg = "Normal completion", stack, location;
      evaluator.evaluate(solution, function (err, val) {
        resume([], {
          result: val,
          errorCode: errorCode,
          message: msg,
          stack: stack,
          location: location,
          toString: function () {
            return this.errorCode + ": (" + location + ") " + msg + "\n" + this.stack;
          }
        });
      });
    } catch (e) {
      if (!e.message) {
        try {
          // Internal error.
          assert(false, message(3008, [e]));
        } catch (x) {
          e = x;
        }
      }
      errorCode = parseErrorCode(e.message);
      msg = parseMessage(e.message);
      stack = e.stack;
      location = e.location;
      console.log("ERROR evaluateVerbose stack=" + stack);
      resume([e.stack], undefined);
    }
    function parseErrorCode(e) {
      let code = +e.slice(0, indexOf(e, ":"));
      if (!isNaN(code)) {
        return code;
      }
      return 0;
    }
    function parseMessage(e) {
      let code = parseErrorCode(e);
      if (code) {
        return e.slice(indexOf(e, ":")+2);
      }
      return e;
    }
  }
  function makeEvaluator(spec) {
    let method = spec.method;
    let value = spec.value;
    let options = Model.options = spec.options;
    Assert.setLocation("spec");
    validateOptions(options);
    Model.pushEnv(env);
    let valueNode = value != undefined ? Model.create(value, "spec") : undefined;
    Model.popEnv();
    let evaluate = function evaluate(solution, resume) {
      Assert.setLocation("user");
      assert(solution != undefined, message(3002));
      Model.pushEnv(env);
      let solutionNode = Model.create(solution, "user");
      Assert.setLocation("spec");
      let result;
      switch (method) {
      case "translate":
        result = solutionNode.translate();
        break;
      default:
        assert(false, message(3004, [method]));
        break;
      }
      Model.popEnv();
      resume(null, result);
    }
    let outerResult = {
      evaluate: evaluate,
      model: valueNode,
    };
    return outerResult;
  }

  // Exports
  return {
    evaluate: evaluate,
    evaluateVerbose: evaluateVerbose,
    makeEvaluator: makeEvaluator,
    Model: Model,
    Ast: Ast
  };
})();

if (typeof window !== "undefined") {
  // Make a browser hook.
  window.Core = Core;
}
