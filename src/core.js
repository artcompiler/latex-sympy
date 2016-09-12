/*
 * Copyright 2016 Art Compiler LLC. All Rights Reserved.
 *
 */
import {version} from "./version.js";
import {every, forEach, keys, indexOf} from "./backward.js";
import {Assert, assert, message} from "./assert.js";
import {Ast} from "./ast.js";
import {Model} from "./model.js";
import {rules} from "./rules.js";

(function (ast) {

  let messages = Assert.messages;

  function newNode(op, args) {
    return {
      op: op,
      args: args
    };
  }

  function binaryNode(op, args, flatten) {
    if (args.length < 2) {
      return args[0];
    }
    var aa = [];
    forEach(args, function(n) {
      if (flatten && n.op === op) {
        aa = aa.concat(n.args);
      } else {
        aa.push(n);
      }
    });
    return newNode(op, aa);
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
      case Model.DIV:
      case Model.FRAC:
      case Model.LOG:
      case Model.COLON:
      case Model.FUNC:
      case Model.TYPE:
        if (node.args.length === 1) {
          node = visit.unary(node, resume);
        } else {
          node = visit.binary(node, resume);
        }
        break;
      case Model.MUL:
      case Model.TIMES:
      case Model.COEFF:
        node = visit.multiplicative(node, resume);
        break;
      case Model.POW:
        node = visit.exponential(node, resume);
        break;
      case Model.VAR:
        node = visit.variable(node, resume);
        break;
      case Model.SQRT:
      case Model.SIN:
      case Model.COS:
      case Model.TAN:
      case Model.SEC:
      case Model.CSC:
      case Model.COT:
      case Model.ARCSIN:
      case Model.ARCCOS:
      case Model.ARCTAN:
      case Model.ARCSEC:
      case Model.ARCCSC:
      case Model.ARCCOT:
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
      case Model.MATHFIELD:
      case Model.SET:
        node = visit.unary(node, resume);
        break;
      case Model.COMMA:
      case Model.MATRIX:
      case Model.VEC:
      case Model.ROW:
      case Model.COL:
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
      case Model.INTERVAL:
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

    function normalizeFormatObject(fmt) {
      // Normalize the fmt object to an array of objects
      var list = [];
      switch (fmt.op) {
      case Model.VAR:
        list.push({
          code: fmt.args[0]
        });
        break;
      case Model.MUL:
        var code = "";
        var length = undefined;  // undefined and zero have different meanings.
        forEach(fmt.args, function (f) {
          if (f.op === Model.VAR) {
            code += f.args[0];
          } else if (f.op === Model.NUM) {
            length = +f.args[0];
          }
        });
        list.push({
          code: code,
          length: length
        });
        break;
      case Model.COMMA:
        forEach(fmt.args, function (f) {
          list = list.concat(normalizeFormatObject(f));
        });
        break;
      }
      return list;
    }

    function checkNumberType(fmt, node) {
      var fmtList = normalizeFormatObject(fmt);
      return fmtList.some(function (f) {
        var code = f.code;
        var length = f.length;
        switch (code) {
        case "integer":
          if (node.numberFormat === "integer") {
            if (length === undefined || length === node.args[0].length) {
              // If there is no size or if the size matches the value...
              return true;
            }
          }
          break;
        case "decimal":
          if (node.numberFormat === "decimal" &&
              node.isRepeating) {
            if (length === undefined) {
              return true;
            } else {
              // Repeating is infinite.
              return false;
            }
          }
          if (node.numberFormat === "decimal") {
            if (length === undefined ||
                length === 0 && indexOf(node.args[0], ".") === -1 ||
                length === node.args[0].substring(indexOf(node.args[0], ".") + 1).length) {
              // If there is no size or if the size matches the value...
              return true;
            }
          }
          break;
        case "number":
          if (node.numberFormat === "decimal" &&
              node.isRepeating) {
            if (length === undefined) {
              return true;
            } else {
              // Repeating is infinite.
              return false;
            }
          }
          if (node.numberFormat === "integer" ||
              node.numberFormat === "decimal") {
            var brk = indexOf(node.args[0], ".");
            if (length === undefined ||
                length === 0 && brk === -1 ||
                brk >= 0 && length === node.args[0].substring(brk + 1).length) {
              // If there is no size or if the size matches the value...
              return true;
            }
          }
          break;
        case "scientific":
          if (node.isScientific) {
            var coeff = node.args[0].args[0];
            if (length === undefined ||
                length === 0 && indexOf(coeff, ".") === -1 ||
                length === coeff.substring(indexOf(coeff, ".") + 1).length) {
              // If there is no size or if the size matches the value...
              return true;
            }
          }
          break;
        case "fraction":
          if (node.isFraction ||
              node.isMixedFraction) {
            return true;
          }
          break;
        case "simpleFraction":
        case "nonMixedFraction": // deprecated
          if (node.isFraction) {
            return true;
          }
          break;
        case "mixedFraction":
          if (node.isMixedFraction) {
            return true;
          }
          break;
        case "fractionOrDecimal":
          if (node.isFraction ||
              node.isMixedFraction ||
              node.numberFormat === "decimal") {
            return true;
          }
          break;
        default:
          assert(false, message(2015, [code]));
          break;
        }
      });
    }
    function matchType(pattern, node) {
      let types = Model.option("types");
      if (pattern.op === Model.TYPE &&
          pattern.args[0].op === Model.VAR) {
        let name = pattern.args[0].args[0];
        switch (name) {
        case "number":
        case "integer":
        case "decimal":
        case "scientific":
        case "fraction":
        case "simpleFraction":
        case "mixedFraction":
        case "fractionOrDecimal":
          return checkNumberType(pattern.args[0], node);
        case "variable":
          return node.op === Model.VAR;
        default:
          let type = types[name];
          if (type) {
            assert(type instanceof Array);
            return type.some(function (pattern) {
              // FIXME pre-compile types.
              let matches = match([normalizeLiteral(Model.create(pattern))], node);
              return matches.length > 0;
            });
          }
        }
        return false;
      } else if (pattern.op === Model.COLON &&
          pattern.args[0].op === Model.VAR && pattern.args[0].args[0] === "?") {
        // This is a legacy case that can be removed when all content is updated.
        assert(pattern.args[1].op === Model.VAR);
        switch (pattern.args[1].args[0]) {
        case "N":
          return node.op === Model.NUM;
        case "V":
          return node.op === Model.VAR;
        default:
        }
        return false;
      }
      return (
        pattern.op === Model.VAR && pattern.args[0] === "?" ||
        pattern.op === Model.MATRIX && node.op === Model.MATRIX
      );
    }

    // ["? + ?", "? - ?"], "1 + 2"
    function match(patterns, node) {
      if (patterns.size === 0 || node === undefined) {
        return false;
      }
      let matches = patterns.filter(function (pattern) {
        if (pattern.op === undefined || node.op === undefined) {
          return false;
        }
        if (ast.intern(pattern) === ast.intern(node) ||
            matchType(pattern, node)) {
          return true;
        }
        if (pattern.op === node.op) {
          if (pattern.args.length === node.args.length) {
            // Same number of args, so see if each matches.
            return pattern.args.every(function (arg, i) {
              if (pattern.op === Model.VAR) {
                if (arg === node.args[i]) {
                  return true;
                }
                return false;
              }
              let result = match([arg], node.args[i]);
              return result.length === 1;
            });
          } else if (pattern.args.length < node.args.length) {
            // Different number of args, then see if there is a wildcard match.
            let nargs = node.args.slice(1);
            if (pattern.args.length === 2) {
              // Binary node pattern
              let result = (
                match([pattern.args[0]], node.args[0]).length > 0 &&
                match([pattern.args[1]], newNode(node.op, nargs)).length > 0
                  // Match rest of the node against the second pattern argument.
              );
              return result;
            }
          }
        }
        return false;
      });
      // if (matches.length > 0) {
      //   console.log("node: " + JSON.stringify(node, null, 2));
      //   console.log("matches: " + JSON.stringify(matches, null, 2));
      // }
      return matches;
    }
    function expandBinary(str, args) {
      let t = str;
      forEach(args, function (arg, i) {
        str = str.replace("%" + (i + 1), arg.args[0]);
      });
      if (args.length > 2) {
        return expandBinary(t, [newNode(Model.VAR, [str])].concat(args.slice(2)));
      }
      return str;
    }
    function expand(template, args) {
      // Use first matched template for now.
      let str = template.str;
      if (str && args) {
        let count = str.split("%").length - 1;
        if (str.indexOf("%%") >= 0) {
          str = str.replace("%%", args[0].args[0]);
        } else if (count === 2 && args.length > 2) {
          str = expandBinary(str, args);
        } else {
          forEach(args, function (arg, i) {
            str = str.replace("%" + (i + 1), arg.args[0]);
          });
        }
        return {
          op: Model.VAR,
          args: [str],
        };
      }
      return "ERROR expand() " + JSON.stringify(str);
    }

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

    function normalizeLiteral(root) {
      if (!root || !root.args) {
        assert(false, "Should not get here. Illformed node.");
        return 0;
      }
      var nid = ast.intern(root);
      // if (root.normalizeLiteralNid === nid) {
      //   return root;
      // }
      var node = visit(root, {
        name: "normalizeLiteral",
        numeric: function (node) {
          return node;
        },
        binary: function (node) {
          var args = [];
          forEach(node.args, function (n) {
            args.push(normalizeLiteral(n));
          });
          node.args = args;
          return node;
        },
        multiplicative: function (node) {
          var args = [];
          var flatten = true;
          forEach(node.args, function (n) {
            if ((n.isPolynomial || n.isImplicit) && args.length > 0) {
              args.push(binaryNode(Model.MUL, [args.pop(), normalizeLiteral(n)], flatten));
            } else {
              args.push(normalizeLiteral(n));
            }
          });
          // Only have explicit mul left, so convert to times.
          var op = node.op === Model.MUL ? Model.TIMES : node.op;
          var n = binaryNode(op, args, true);
          n.isScientific = node.isScientific;
          n.isMixedFraction = node.isMixedFraction;
          n.isBinomial = node.isBinomial;
          return n;
        },
        unary: function(node) {
          var args = [];
          forEach(node.args, function (n) {
            args.push(normalizeLiteral(n));
          });
          return newNode(node.op, args);
        },
        exponential: function (node) {
          var args = [];
          forEach(node.args, function (n) {
            args.push(normalizeLiteral(n));
          });
          node.args = args;
          return node;
        },
        variable: function(node) {
          return node;
        },
        comma: function(node) {
          var args = [];
          forEach(node.args, function (n) {
            args.push(normalizeLiteral(n));
          });
          node.args = args;
          return node;
        },
        paren: function(node) {
          var args = [];
          forEach(node.args, function (n) {
            args.push(normalizeLiteral(n));
          });
          node.args = args;
          return node;
        },
        equals: function(node) {
          var args = [];
          forEach(node.args, function (n) {
            args.push(normalizeLiteral(n));
          });
          if (option("ignoreOrder") &&
              (node.op === Model.GT ||
               node.op === Model.GE)) {
            // Swap adjacent elements and reverse the operator.
            assert(args.length === 2, "Internal error: comparisons have only two operands");
            var t = args[0];
            args[0] = args[1];
            args[1] = t;
            node.op = node.op === Model.GT ? Model.LT : Model.LE;
            node.args = args;
          } else {
            node.args = args;
          }
          return node;
        }
      });
      // // If the node has changed, normalizeLiteral again
      // while (nid !== ast.intern(node)) {
      //   nid = ast.intern(node);
      //   node = normalizeLiteral(node);
      // }
      // node.normalizeLiteralNid = nid;
      // node.normalizeLiteralNid = ast.intern(node);
      return node;
    }

    function matchedTemplate(rules, matches, arity) {
      let templates = [];
      matches.forEach(function (m) {
        templates = templates.concat(rules[JSON.stringify(m)]);
      });
      let matchedTemplates = [];
      templates.forEach(function (t) {
        if((!t.context ||
            Model.option("NoParens") && t.context.indexOf("NoParens") > -1 ||
            Model.option("EndRoot") && t.context.indexOf("EndRoot") > -1) &&
           arity >= paramCount(t)) {  // Some args might be elided.
          matchedTemplates.push(t);
        }
      });
      //assert(matchedTemplates.length > 0);
      if (matchedTemplates.length === 0) {
        // Make one up.
        matchedTemplates.push({str: "missing template %1"});
      }
      // Use first match.
      return matchedTemplates[0];
      function paramCount(template) {
        // Parse out the number of params in the template.
        assert(typeof template.str === "string");
        let a = template.str.split("%");
        let nn = a.filter(n => {
          return !isNaN(+n[0])
        });
        return nn.length === 0 ? 0 : +nn.sort()[nn.length-1][0];
      }
    }
    function getNodeArgsForTemplate(node, template) {
      // Parse out the number of params in the template.
      assert(typeof template.str === "string");
      let str = template.str;
      if (str.indexOf("%%") >= 0) {
        return [node];
      }
      let a = str.split("%");
      let nn = a.filter(n => {
        return n[0] === "%" || !isNaN(+n[0])
      });
      return node.args;
    }
    function translate(root, rules) {
      // Translate math from LaTeX to English.
      // rules = {ptrn: tmpl, ...};
      let globalRules;
      if (rules instanceof Array) {
        if (rules.length === 1) {
          rules = rules[0];
        } else {
          rules = mergeMaps(rules[1], rules[0]);
        }
      }
      globalRules = rules;
      let keys = Object.keys(rules);
      // FIXME when IE supports Map, this can be removed.
      let patterns = [];
      keys.forEach(k => {
        patterns.push(JSON.parse(k));
      });
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
          let template = matchedTemplate(rules, matches, 1);
          return expand(template, args);
        },
        binary: function(node) {
          let matches = match(patterns, node);
          if (matches.length === 0) {
            return node;
          }
          let template = matchedTemplate(rules, matches, node.args.length);
          let argRules = getRulesForArgs(template);
          let nodeArgs = getNodeArgsForTemplate(node, template);
          let args = [];
          forEach(nodeArgs, function (n, i) {
            args = args.concat(translate(n, [globalRules, argRules]));
          });
          return expand(template, args);
        },
        multiplicative: function(node) {
          let matches = match(patterns, node);
          if (matches.length === 0) {
            return node;
          }
          // Use first match for now.
          let template = matchedTemplate(rules, matches, node.args.length);
          let argRules = getRulesForArgs(template, rules);
          let nodeArgs = getNodeArgsForTemplate(node, template);
          let args = [];
          forEach(nodeArgs, function (n, i) {
            args = args.concat(translate(n, [globalRules, argRules]));
          });
          return expand(template, args);
        },
        unary: function(node) {
          let matches = match(patterns, node);
          if (matches.length === 0) {
            return node;
          }
          // Use first match for now.
          let template = matchedTemplate(rules, matches, node.args.length);
          let argRules = getRulesForArgs(template, rules);
          let nodeArgs = getNodeArgsForTemplate(node, template);
          let args = [];
          forEach(nodeArgs, function (n, i) {
            args = args.concat(translate(n, [globalRules, argRules]));
          });
          return expand(template, args);
        },
        exponential: function(node) {
          let matches = match(patterns, node);
          if (matches.length === 0) {
            return node;
          }
          // Use first match for now.
          let template = matchedTemplate(rules, matches, node.args.length);
          let argRules = getRulesForArgs(template, rules);
          let nodeArgs = getNodeArgsForTemplate(node, template);
          let args = [];
          forEach(nodeArgs, function (n, i) {
            args = args.concat(translate(n, [globalRules, argRules]));
          });
          return expand(template, args);
        },
        variable: function(node) {
          // let str = "";
          // forEach(node.args, function (n, i) {
          //   // This is a little bit of a hack to handle how subscripts are encoded
          //   // as compound variables.
          //   if (i > 0) {
          //     str += " sub ";
          //     let v = translate(n, rules);
          //     str += v.args[0];
          //     str += " baseline ";
          //   } else {
          //     str += lookup(n);
          //   }
          // });
          // let matches = match(patterns, node);
          // let args = [newNode(Model.VAR, [str])];
          // if (matches.length === 0) {
          //   return args[0];
          // }
          // // Use first match for now.
          // let template = matchedTemplate(rules, matches, 1);
          // return expand(template, args);
          let matches = match(patterns, node);
          if (matches.length === 0) {
            return node;
          }
          // Use first match for now.
          let template = matchedTemplate(rules, matches, node.args.length);
          let argRules = getRulesForArgs(template, rules);
          let nodeArgs = getNodeArgsForTemplate(node, template);
          let args = [];
          args.push(newNode(Model.VAR, [lookup(nodeArgs.shift())]));
          forEach(nodeArgs, function (n, i) {
            // Now translate the subscripts.
            args = args.concat(translate(n, [globalRules, argRules]));
          });
          return expand(template, args);
        },
        comma: function(node) {
          if (node.op === Model.MATRIX || node.op === Model.ROW || node.op === Model.COL) {
            let matches = match(patterns, node);
            if (matches.length === 0) {
              return node;
            }
            // Use first match for now.
            let template = matchedTemplate(rules, matches, node.args.length);
            let args = [];
            let argRules = getRulesForArgs(template, rules);
            let nodeArgs = getNodeArgsForTemplate(node, template);
            forEach(nodeArgs, function (n, i) {
              args = args.concat(translate(n, [globalRules, argRules]));
            });
            return expand(template, args);
          } else {
            let matches = match(patterns, node);
            if (matches.length === 0) {
              return node;
            }
            // Use first match for now.
            let template = matchedTemplate(rules, matches, node.args.length);
            let argRules = getRulesForArgs(template, rules);
            let nodeArgs = getNodeArgsForTemplate(node, template);
            let args = [];
            forEach(nodeArgs, function (n, i) {
              args = args.concat(translate(n, [globalRules, argRules]));
            });
            return expand(template, args);
          }
        },
        equals: function(node) {
          let matches = match(patterns, node);
          if (matches.length === 0) {
            return node;
          }
          // Use first match for now.
          let template = matchedTemplate(rules, matches, node.args.length);
          let argRules = getRulesForArgs(template, rules);
          let nodeArgs = getNodeArgsForTemplate(node, template);
          let args = [];
          forEach(nodeArgs, function (n, i) {
            args = args.concat(translate(n, [globalRules, argRules]));
          });
          return expand(template, args);
        },
        paren: function(node) {
          //assert (node.args.length === 1);
          let matches = match(patterns, node);
          if (matches.length === 0) {
            return node;
          } else if (matches.length > 1) {
            // Have more than one match, so compare brackets
            var t = matches;
            matches = matches.filter((n) => {
              return n.lbrk === node.lbrk && n.rbrk === node.rbrk;
            });
            if (matches.length === 0) {
              // Restore original matches.
              matches = t;
            }
          }
          // Use first match for now.
          let template = matchedTemplate(rules, matches, 1);
          let argRules = getRulesForArgs(template, rules);
          let nodeArgs = getNodeArgsForTemplate(node, template);
          let args = [];
          forEach(nodeArgs, function (n) {
            args.push(translate(n, [globalRules, argRules]));
          });
          return expand(template, args);
        }
      });
    }

    this.normalizeLiteral = normalizeLiteral;
    this.translate = translate;
  }

  function normalizeLiteral(node) {
    let visitor = new Visitor(ast);
    var prevLocation = Assert.location;
    if (node.location) {
      Assert.setLocation(node.location);
    }
    var result = visitor.normalizeLiteral(node);
    Assert.setLocation(prevLocation);
    return result;
  }

  function dumpRules(rules) {
    let str = "";
    for (var [key, val] of rules) {
      str += JSON.stringify(key, null, 2) + " --> " + JSON.stringify(val, null, 2) + "\n";
    }
    return str;
  }

  function getRulesForArgs(template, rules) {
    // Use first match for now.
    return template.rules;
  }

  function mergeMaps(m1, m2) {
    let map = {};
    if (m1) {
      let keys = Object.keys(m1);
      keys.forEach(k => {
        map[k] = m1[k];
      });
    }
    let keys = Object.keys(m2);
    keys.forEach(k => {
      if (!map[k]) {
        map[k] = m2[k];
      }
    });
    return map;
  }
  function compileTemplate(template) {
    let compiledTemplate;
    if (template instanceof Array) {
      compiledTemplate = [];
      template.forEach(function (t) {
        compiledTemplate = compiledTemplate.concat(compileTemplate(t));
      });
    } else {
      if (typeof template === "string") {
        // "%1"
        compiledTemplate = [{
          str: template,
        }];
      } else {
        // {"%1": {"?": "%1"}}
        // [cntx1 "%1", cntx2 {"%1": {?: "%1"}}] --> [{context: "cntx1", str: "%1"},...]
        let context = "", str, rules;
        if (template.options) {
          context += template.options.EndRoot ? " EndRoot" : "";
          context += template.options.NoParens ? " NoParens" : "";
          str = template.value;
        } else {
          str = Object.keys(template)[0];
          assert(str !== "options");
          rules = compileRules(template[str]);
        }
        compiledTemplate = [{
          context: context,
          str: str,
          rules: rules,
        }];
      }
    }
    return compiledTemplate;
  }
  function compileRules(rules) {
    // { "ast as string": template, ... }
    let keys = Object.keys(rules);
    let compiledRules = {};
    keys.forEach(function (key) {
      let pattern = JSON.stringify(normalizeLiteral(Model.create(key)));  // Parse and normalize.
      let template = compileTemplate(rules[key]);
      if (!compiledRules[pattern]) {
        compiledRules[pattern] = template;
      }
    });
    return compiledRules;
  }
  function translate(node, rules) {
    let visitor = new Visitor(ast);
    let compiledRules = compileRules(rules);
    return visitor.translate(node, compiledRules);
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
    while (out.lastIndexOf("baseline") !== -1 && out.lastIndexOf(" baseline") === out.length - " baseline".length) {
      // Trim off trailing modifiers
      out = out.substring(0, out.length - " baseline".length);
    }
    return out;
  }
  Model.fn.translate = function (n1) {
    let rules = Model.option("rules");
    let n = translate(normalizeLiteral(n1), rules);
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
      case "types":
        opt = {};
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
    "\\omega": { type: "var" },
    "\\sin": { type: "var" },
    "\\cos": { type: "var" },
    "\\tan": { type: "var" },
    "\\sec": { type: "var" },
    "\\csc": { type: "var" },
    "\\cot": { type: "var" },
    "\\arcsin": { type: "var" },
    "\\arccos": { type: "var" },
    "\\arctan": { type: "var" },
    "\\arcsec": { type: "var" },
    "\\arccsc": { type: "var" },
    "\\arccot": { type: "var" },
    "\\sinh": { type: "var" },
    "\\cosh": { type: "var" },
    "\\tanh": { type: "var" },
    "\\sech": { type: "var" },
    "\\csch": { type: "var" },
    "\\coth": { type: "var" },
    "\\log": { type: "var" },
    "\\ln": { type: "var" },
    "\\lg": { type: "var" },
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
    case "NoParens":
    case "EndRoot":
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
    case "types":
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
  function translate(options, solution, resume) {
    if (!options) {
      options = {};
    }
    if (!options.rules) {
      options.words = rules.words;
      options.rules = rules.rules;
      options.types = rules.types;
    }
    let spec = {
      method: "translate",
      options: options
    };
    let evaluator = makeEvaluator(spec, resume);
    evaluator.evaluate(solution, resume);
  }
  function makeEvaluator(spec, resume) {
    let valueNode;
    let method = spec.method;
    let value = spec.value;
    let options = Model.options = spec.options;
    let pendingError;
    try {
      Assert.setLocation("spec");
      validateOptions(options);
      Model.pushEnv(env);
      valueNode = value != undefined ? Model.create(value, "spec") : undefined;
      Model.popEnv();
    } catch (e) {
      console.log(e.stack);
      pendingError = e;
    }
    let evaluate = function evaluate(solution, resume) {
      try {
        if (pendingError) {
          throw pendingError;
        }
        Assert.setLocation("user");
        assert(solution != undefined, message(3002));
        Model.pushEnv(env);
        let solutionNode = Model.create(solution, "user");
        assert(solutionNode, message(3008, ["invalid input"]));
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
      } catch (e) {
        console.log(e.stack);
        let message = e.message;
        resume({
          result: null,
          errorCode: parseErrorCode(message),
          message: parseMessage(message),
          stack: e.stack,
          location: e.location,
          model: null,  // Unused, for now.
          toString: function () {
            return this.errorCode + ": (" + this.location + ") " + this.message + "\n" + this.stack;
          },
        }, solution);  // If error, return the original text.
      }
    };
    return {
      evaluate: evaluate,
      model: valueNode,
    };
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

  // Exports
  return {
    translate: translate,
    Model: Model,
    Ast: Ast
  };
})();

if (typeof window !== "undefined") {
  // Make a browser hook.
  window.Core = Core;
}
