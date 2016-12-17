/*
 * Copyright 2013 Art Compiler LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
  This module defines an object model for evaluating and comparing LaTex
  strings. The primary data structure is the Model class. Instances of the
  Model class contain an AST (Ast instance) and zero or more plugins that
  provide functions for evaluating, transforming and comparing models.

  Basic Terms

  Node - a node is a raw JavaScript object that consists of an 'op' property
  that is a string indicating the node type, an 'args' property that is an array
  that holds the operands of the operation, and any other "attribute" properties
  used by plugins to elaborate the mean meaning of the node.

  AST - an AST is an a Node that is an instance of the Ast class. The Ast class
  provides methods for constructing and managing nodes.

  Model - a model is a Node that is an instance of the Model class, which
  inherits from the Ast class. The model class adds methods for creating nodes
  from LaTex strings and rendering them to LaTex strings. Model values are
  configured by Model plugins that implement operations for evaluating,
  transforming and comparing nodes.

  Overview

  Every model object is also a factory for other model objects that share
  the same set of plugins.

    Model.fn.isEquivalent; // register plugin function
    let model = new Model;
    let expected = model.create("1 + 2");
    let actual = model.create(response);
    model.isEquivalent(expected, actual);
    expected.isEquivalent(actual);

  When all models in a particular JavaScript sandbox (global scope) use the same
  plugins, those plugins can be registered with the Model class as default
  plugins, as follows:

*/

import {every, forEach, keys, some, indexOf} from "./backward.js";
import {Assert, assert, message} from "./assert.js";
import {Ast} from "./ast.js";

export let Model = (function () {

  function error(str) {
    trace("error: " + str);
  }

  function Model() {
  }

  Model.fn = {};
  Model.env = env = {};
  let envStack = [];
  let env = {};

  Model.pushEnv = function pushEnv(e) {
    envStack.push(env);
    Model.env = env = e;
  }

  Model.popEnv = function popEnv() {
    assert(envStack.length > 0, "Empty envStack");
    Model.env = env = envStack.pop();
  }

  function isChemCore() {
    // Has chem symbols so in chem mode
    return !!Model.env["Au"];
  }

  let Mp = Model.prototype = new Ast();

  // Add messages here
  Assert.reserveCodeRange(1000, 1999, "model");
  Assert.messages[1001] = "Invalid syntax. '%1' expected, '%2' found.";
  Assert.messages[1002] = "Only one decimal separator can be specified.";
  Assert.messages[1003] = "Extra characters in input at position: %1, lexeme: %2.";
  Assert.messages[1004] = "Invalid character '%1' (%2) in input.";
  Assert.messages[1005] = "Misplaced thousands separator.";
  Assert.messages[1006] = "Invalid syntax. Expression expected, %1 found.";
  Assert.messages[1007] = "Unexpected character: '%1' in '%2'.";
  Assert.messages[1008] = "The same character '%1' is being used as a thousands and decimal separators.";
  Assert.messages[1009] = "Missing argument for '%1' command.";
  Assert.messages[1010] = "Expecting an operator between numbers.";
  let message = Assert.message;

  // Create a model from a node object or expression string
  Model.create = Mp.create = function create(node, location) {
    assert(node != undefined, "Model.create() called with invalid argument " + node);
    // If we already have a model, then just return it.
    if (node instanceof Model) {
      if (location) {
        node.location = location;
      }
      return node;
    }
    let model;
    if (node instanceof Array) {
      model = [];
      forEach(node, function (n) {
        model.push(create(n, location));
      });
      return model;
    }
    if (!(this instanceof Model)) {
      return new Model().create(node, location);
    }
    // Create a node that inherits from Ast
    model = create(this);
    model.location = location;
    if (typeof node === "string") {
      // Got a string, so parse it into a node
      let parser = parse(node, Model.env);
      node = parser.expr();
    } else {
      // Make a deep copy of the node
      node = JSON.parse(JSON.stringify(node));
    }
    // Add missing plugin functions to the Model prototype
    forEach(keys(Model.fn), function (v, i) {
      if (!Mp.hasOwnProperty(v)) {
        Mp[v] = function () {
          let fn = Model.fn[v];
          if (arguments.length > 1 &&
              arguments[1] instanceof Model) {
            return fn.apply(this, arguments);
          } else {
            let args = [this];
            for (let i = 0; i < arguments.length; i++) {
              args.push(arguments[i]);
            }
            return fn.apply(this, args);
          }
        }
      }
    });
    // Now copy the node's properties into the model object
    forEach(keys(node), function (v, i) {
      model[v] = node[v];
    });
    return model;
  };

  // Render LaTex from the model node.
  Mp.toLaTex = function toLaTex(node) {
    return render(node);
  }

  let OpStr = {
    ADD: "+",
    SUB: "-",
    MUL: "mul",
    TIMES: "times",
    COEFF: "coeff",
    DIV: "div",
    FRAC: "frac",
    EQL: "=",
    ATAN2: "atan2",
    SQRT: "sqrt",
    VEC: "vec",
    PM: "pm",
    NOT: "not",
    // SIN: "sin",
    // COS: "cos",
    // TAN: "tan",
    // SEC: "sec",
    // COT: "cot",
    // CSC: "csc",
    // ARCSIN: "arcsin",
    // ARCCOS: "arccos",
    // ARCTAN: "arctan",
    // ARCSEC: "arcsec",
    // ARCCOT: "arccot",
    // ARCCSC: "arccsc",
    // LOG: "log",
    // LN: "ln",
    // LG: "lg",
    VAR: "var",
    NUM: "num",
    CST: "cst",
    COMMA: ",",
    POW: "^",
    SUBSCRIPT: "_",
    ABS: "abs",
    PAREN: "()",
    HIGHLIGHT: "hi",
    LT: "lt",
    LE: "le",
    GT: "gt",
    GE: "ge",
    NE: "ne",
    NGTR: "ngtr",
    NLESS: "nless",
    NI: "ni",
    SUBSETEQ: "subseteq",
    SUPSETEQ: "supseteq",
    SUBSET: "subset",
    SUPSET: "supset",
    NNI: "nni",
    NSUBSETEQ: "nsubseteq",
    NSUPSETEQ: "nsupseteq",
    NSUBSET: "nsubset",
    NSUPSET: "nsupset",
    APPROX: "approx",
    IMPLIES: "implies",
    RIGHTARROW: "rightarrrow",
    LEFTARROW: "leftarrrow",
    LONGRIGHTARROW: "longrightarrow",
    LONGLEFTARROW: "longleftarrow",
    OVERRIGHTARROW: "overrightarrow",
    OVERLEFTARROW: "overleftarrow",
    LONGLEFTRIGHTARROW: "longleftrightarrow",
    OVERLEFTRIGHTARROW: "overleftrightarrow",
    PERP: "perp",
    PROPTO: "propto",
    PARALLEL: "parallel",
    NPARALLEL: "nparallel",
    SIM: "sim",
    CONG: "cong",
    INTERVAL: "interval",
    LIST: "list",
    SET: "set",
    EXISTS: "exists",
    IN: "in",
    FORALL: "forall",
    LIM: "lim",
    EXP: "exp",
    TO: "to",
    SUM: "sum",
    PIPE: "pipe",
    INT: "int",
    PROD: "prod",
    CUP: "cup",
    BIGCUP: "bigcup",
    CAP: "cap",
    BIGCAP: "bigcap",
    PERCENT: "%",
    QMARK: "?",
    M: "M",
    FACT: "fact",
    BINOM: "binom",
    ROW: "row",
    COL: "col",
    COLON: "colon",
    MATRIX: "matrix",
    TYPE: "type",
    OVERSET: "overset",
    UNDERSET: "underset",
    OVERLINE: "overline",
    DEGREE: "degree",
    BACKSLASH: "backslash",
    MATHBF: "mathbf",
    DOT: "dot",
    MATHFIELD: "mathfield",
    NONE: "none",
  };

  forEach(keys(OpStr), function (v, i) {
    Model[v] = OpStr[v];
  });

  let OpToLaTeX = {};
  OpToLaTeX[OpStr.ADD] = "+";
  OpToLaTeX[OpStr.SUB] = "-";
  OpToLaTeX[OpStr.MUL] = "\\times";
  OpToLaTeX[OpStr.DIV] = "\\div";
  OpToLaTeX[OpStr.FRAC] = "\\frac";
  OpToLaTeX[OpStr.EQL] = "=";
  OpToLaTeX[OpStr.ATAN2] = "\\atan2";
  OpToLaTeX[OpStr.POW] = "^";
  OpToLaTeX[OpStr.SUBSCRIPT] = "_";
  OpToLaTeX[OpStr.PM] = "\\pm";
  OpToLaTeX[OpStr.NOT] = "\\not";
  // OpToLaTeX[OpStr.SIN] = "\\sin";
  // OpToLaTeX[OpStr.COS] = "\\cos";
  // OpToLaTeX[OpStr.TAN] = "\\tan";
  // OpToLaTeX[OpStr.SEC] = "\\sec";
  // OpToLaTeX[OpStr.COT] = "\\cot";
  // OpToLaTeX[OpStr.CSC] = "\\csc";
  // OpToLaTeX[OpStr.ARCSIN] = "\\arcsin";
  // OpToLaTeX[OpStr.ARCCOS] = "\\arccos";
  // OpToLaTeX[OpStr.ARCTAN] = "\\arctan";
  // OpToLaTeX[OpStr.ARCSEC] = "\\arcsec";
  // OpToLaTeX[OpStr.ARCCOT] = "\\arccot";
  // OpToLaTeX[OpStr.ARCCSC] = "\\arccsc";
  // OpToLaTeX[OpStr.LN] = "\\ln";
  OpToLaTeX[OpStr.COMMA] = ",";
  OpToLaTeX[OpStr.M] = "\\M";
  OpToLaTeX[OpStr.BINOM] = "\\binom";
  OpToLaTeX[OpStr.COLON] = "\\colon";

  Model.fold = function fold(node, env) {
    let args = [], val;
    forEach(node.args, function (n) {
      args.push(fold(n, env));
    });
    node.args = args;
    switch (node.op) {
    case OpStr.VAR:
      if ((val = env[node.args[0]])) {
        node = val;  // Replace var node with its value.
      }
      break;
    default:
      // Nothing to fold.
      break;
    }
    return node;
  }

  function isInvisibleCharCode(c) {
    return isControlCharCode(c);
  }
  function isWhitespaceCharCode(c) {
    return (
      c === 32 ||
        c === 9  ||
        c === 10 ||
        c === 13
    );
  }
  function isAlphaCharCode(c) {
    return c >= 65 && c <= 90 ||
      c >= 97 && c <= 122 ||
      c === 39;
  }
  function isNumberCharCode(c) {
    return (
      c >= 48 && c <= 57
    );
  }
  function isControlCharCode(c) {
    return (
      c >= 0x0001 && c <= 0x001F ||
        c >= 0x007F && c <= 0x009F
    );
  }
  function stripInvisible(src) {
    var out = "";
    var c, lastCharCode;
    var curIndex = 0;
    while(curIndex < src.length) {
      while (curIndex < src.length && isInvisibleCharCode((c = src.charCodeAt(curIndex++)))) {
        if (lastCharCode === 32) {
          // Replace N invisible char with one space char.
          continue;
        }
        c = 9;
        lastCharCode = c;
      }
      if (c === 92) {
        // Backslash. Keep next character.
        out += String.fromCharCode(c);
        c = src.charCodeAt(curIndex++);
      } else if (c === 9) {
        // Got an invisible character, check if separating numbers.
        if (isNumberCharCode(out.charCodeAt(out.length - 1)) && isNumberCharCode(src.charCodeAt(curIndex))) {
          // Erase the space.
          c = src.charCodeAt(curIndex++);
        }
      }
      out += String.fromCharCode(c);
    }
    return out;
  }


  let parse = function parse(src, env) {
    src = stripInvisible(src);
    // Define lexical tokens
    let TK_NONE = 0;
    let TK_ADD = '+'.charCodeAt(0);
    let TK_CARET = '^'.charCodeAt(0);
    let TK_UNDERSCORE = '_'.charCodeAt(0);
    let TK_COS = 0x105;
    let TK_COT = 0x108;
    let TK_CSC = 0x109;
    let TK_FRAC = 0x100;
    let TK_SLASH = '/'.charCodeAt(0);
    let TK_EQL = '='.charCodeAt(0);
    let TK_LN = 0x107;
    let TK_LEFTBRACE = '{'.charCodeAt(0);
    let TK_VERTICALBAR = '|'.charCodeAt(0);
    let TK_LEFTBRACKET = '['.charCodeAt(0);
    let TK_LEFTPAREN = '('.charCodeAt(0);
    let TK_MUL = '*'.charCodeAt(0);
    let TK_NUM = '0'.charCodeAt(0);
    let TK_PM = 0x102;
    let TK_RIGHTBRACE = '}'.charCodeAt(0);
    let TK_RIGHTBRACKET = ']'.charCodeAt(0);
    let TK_RIGHTPAREN = ')'.charCodeAt(0);
    let TK_SEC = 0x106;
    let TK_SIN = 0x103;
    let TK_SQRT = 0x101;
    let TK_SUB = '-'.charCodeAt(0);
    let TK_TAN = 0x104;
    let TK_VAR = 'a'.charCodeAt(0);
    let TK_CONST = 'A'.charCodeAt(0);
    let TK_NEXT = 0x10A;
    let TK_COMMA = ','.charCodeAt(0);
    let TK_LG = 0x10B;
    let TK_LOG = 0x10C;
    let TK_TEXT = 0x10D;
    let TK_LT = 0x10E;
    let TK_LE = 0x10F;
    let TK_GT = 0x110;
    let TK_GE = 0x111;
    let TK_EXISTS = 0x112;
    let TK_IN = 0x113;
    let TK_FORALL = 0x114;
    let TK_LIM = 0x115;
    let TK_EXP = 0x116;
    let TK_TO = 0x117;
    let TK_SUM = 0x118;
    let TK_INT = 0x119;
    let TK_PROD = 0x11A;
    let TK_PERCENT = '%'.charCodeAt(0);
    let TK_QMARK = '?'.charCodeAt(0);
    let TK_M = 0x11B;
    let TK_RIGHTARROW = 0x11C;
    let TK_BANG = '!'.charCodeAt(0);
    let TK_BINOM = 0x11D;
    let TK_NEWROW = 0x11E;
    let TK_NEWCOL = 0x11F;
    let TK_BEGIN = 0x120;
    let TK_END = 0x121;
    let TK_COLON = ':'.charCodeAt(0);
    let TK_VEC = 0x122;
    let TK_ARCSIN = 0x123;
    let TK_ARCCOS = 0x124;
    let TK_ARCTAN = 0x125;
    let TK_DIV = 0x126;
    let TK_TYPE = 0x127;
    let TK_OVERLINE = 0x128;
    let TK_OVERSET = 0x129;
    let TK_UNDERSET = 0x12A;
    let TK_BACKSLASH = 0x12B;
    let TK_MATHBF = 0x12C;
    let TK_NE = 0x12D;
    let TK_APPROX = 0x12E;
    let TK_ABS = 0x12F;
    let TK_DOT = 0x130;
    let TK_ARCSEC = 0x131;
    let TK_ARCCSC = 0x132;
    let TK_ARCCOT = 0x133;
    let TK_MATHFIELD = 0x134;
    let TK_CUP = 0x135;
    let TK_BIGCUP = 0x136;
    let TK_CAP = 0x137;
    let TK_BIGCAP = 0x138;
    let TK_PERP = 0x139;
    let TK_PROPTO = 0x13A;
    let TK_NGTR = 0x13B;
    let TK_NLESS = 0x13C;
    let TK_NI = 0x13D;
    let TK_SUBSETEQ = 0x13E;
    let TK_SUPSETEQ = 0x13F;
    let TK_SUBSET = 0x140;
    let TK_SUPSET = 0x141;
    let TK_NOT = 0x142;
    let TK_PARALLEL = 0x143;
    let TK_NPARALLEL = 0x144;
    let TK_SIM = 0x145;
    let TK_CONG = 0x146;
    let TK_LEFTARROW = 0x147;
    let TK_LONGRIGHTARROW = 0x148;
    let TK_LONGLEFTARROW = 0x149;
    let TK_OVERRIGHTARROW = 0x14A;
    let TK_OVERLEFTARROW = 0x14B;
    let TK_LONGLEFTRIGHTARROW = 0x14C;
    let TK_OVERLEFTRIGHTARROW = 0x14D;
    let TK_IMPLIES = 0x14E;
    let T0 = TK_NONE, T1 = TK_NONE;
    // Define mapping from token to operator
    let tokenToOperator = {};
    tokenToOperator[TK_SLASH] = OpStr.FRAC;
    tokenToOperator[TK_FRAC] = OpStr.FRAC;
    tokenToOperator[TK_SQRT] = OpStr.SQRT;
    tokenToOperator[TK_VEC] = OpStr.VEC;
    tokenToOperator[TK_ADD] = OpStr.ADD;
    tokenToOperator[TK_SUB] = OpStr.SUB;
    tokenToOperator[TK_PM] = OpStr.PM;
    tokenToOperator[TK_NOT] = OpStr.NOT;
    tokenToOperator[TK_CARET] = OpStr.POW;
    tokenToOperator[TK_UNDERSCORE] = OpStr.SUBSCRIPT;
    tokenToOperator[TK_MUL] = OpStr.MUL;
    tokenToOperator[TK_DOT] = OpStr.DOT;
    tokenToOperator[TK_DIV] = OpStr.DIV;
    tokenToOperator[TK_EQL] = OpStr.EQL;
    tokenToOperator[TK_COMMA] = OpStr.COMMA;
    tokenToOperator[TK_TEXT] = OpStr.TEXT;
    tokenToOperator[TK_LT] = OpStr.LT;
    tokenToOperator[TK_LE] = OpStr.LE;
    tokenToOperator[TK_GT] = OpStr.GT;
    tokenToOperator[TK_GE] = OpStr.GE;
    tokenToOperator[TK_NE] = OpStr.NE;
    tokenToOperator[TK_NGTR] = OpStr.NGTR;
    tokenToOperator[TK_NLESS] = OpStr.NLESS;
    tokenToOperator[TK_NI] = OpStr.NI;
    tokenToOperator[TK_SUBSETEQ] = OpStr.SUBSETEQ;
    tokenToOperator[TK_SUPSETEQ] = OpStr.SUPSETEQ;
    tokenToOperator[TK_SUBSET] = OpStr.SUBSET;
    tokenToOperator[TK_SUPSET] = OpStr.SUPSET;
    tokenToOperator[TK_APPROX] = OpStr.APPROX;
    tokenToOperator[TK_PERP] = OpStr.PERP;
    tokenToOperator[TK_PROPTO] = OpStr.PROPTO;
    tokenToOperator[TK_PARALLEL] = OpStr.PARALLEL;
    tokenToOperator[TK_NPARALLEL] = OpStr.NPARALLEL;
    tokenToOperator[TK_SIM] = OpStr.SIM;
    tokenToOperator[TK_CONG] = OpStr.CONG;
    tokenToOperator[TK_EXISTS] = OpStr.EXISTS;
    tokenToOperator[TK_IN] = OpStr.IN;
    tokenToOperator[TK_FORALL] = OpStr.FORALL;
    tokenToOperator[TK_LIM] = OpStr.LIM;
    tokenToOperator[TK_EXP] = OpStr.EXP;
    tokenToOperator[TK_TO] = OpStr.TO;
    tokenToOperator[TK_VERTICALBAR] = OpStr.PIPE;
    tokenToOperator[TK_SUM] = OpStr.SUM;
    tokenToOperator[TK_INT] = OpStr.INT;
    tokenToOperator[TK_PROD] = OpStr.PROD;
    tokenToOperator[TK_CUP] = OpStr.CUP;
    tokenToOperator[TK_BIGCUP] = OpStr.BIGCUP;
    tokenToOperator[TK_CAP] = OpStr.CAP;
    tokenToOperator[TK_BIGCAP] = OpStr.BIGCAP;
    tokenToOperator[TK_M] = OpStr.M;
    tokenToOperator[TK_IMPLIES] = OpStr.IMPLIES;
    tokenToOperator[TK_RIGHTARROW] = OpStr.RIGHTARROW;
    tokenToOperator[TK_LEFTARROW] = OpStr.LEFTARROW;
    tokenToOperator[TK_LONGRIGHTARROW] = OpStr.LONGRIGHTARROW;
    tokenToOperator[TK_LONGLEFTARROW] = OpStr.LONGLEFTARROW;
    tokenToOperator[TK_OVERRIGHTARROW] = OpStr.OVERRIGHTARROW;
    tokenToOperator[TK_OVERLEFTARROW] = OpStr.OVERLEFTARROW;
    tokenToOperator[TK_LONGLEFTRIGHTARROW] = OpStr.LONGLEFTRIGHTARROW;
    tokenToOperator[TK_OVERLEFTRIGHTARROW] = OpStr.OVERLEFTRIGHTARROW;

    tokenToOperator[TK_BANG] = OpStr.FACT;
    tokenToOperator[TK_BINOM] = OpStr.BINOM;
    tokenToOperator[TK_NEWROW] = OpStr.ROW;
    tokenToOperator[TK_NEWCOL] = OpStr.COL;
    tokenToOperator[TK_COLON] = OpStr.COLON;
    tokenToOperator[TK_TYPE] = OpStr.TYPE;
    tokenToOperator[TK_OVERLINE] = OpStr.OVERLINE;
    tokenToOperator[TK_OVERSET] = OpStr.OVERSET;
    tokenToOperator[TK_UNDERSET] = OpStr.UNDERSET;
    tokenToOperator[TK_BACKSLASH] = OpStr.BACKSLASH;
    tokenToOperator[TK_MATHBF] = OpStr.MATHBF;
    tokenToOperator[TK_DOT] = OpStr.DOT;
    tokenToOperator[TK_MATHFIELD] = OpStr.MATHFIELD;

    function newNode(op, args) {
      return {
        op: op,
        args: args
      };
    }

    function matchThousandsSeparator(ch, last) {
      // Check separator and return if there is a match.
      if (Model.option("allowThousandsSeparator") || Model.option("setThousandsSeparator")) {
        let separators = Model.option("setThousandsSeparator");
        if (!separators) {
          // Use defaults.
          return ch === ',' ? ch : '';
        } else {
          // If the character matches the last separator or, if not, last is undefiend
          // and character is in the provided list, return the character.
          if (ch === last || !last && indexOf(separators, ch) >= 0) {
            return ch;
          } else {
            return "";
          }
        }
      }
      // Not allowed. Will be treated as punctuation of some other kind.
      return '';
    }

    function matchDecimalSeparator(ch) {
      // We use the thousands separator to determine the conventional decimal
      // separator. If TS is ',' then DS is '.', otherwise DS is ','.
      let decimalSeparator = Model.option("setDecimalSeparator");
      let thousandsSeparators = Model.option("setThousandsSeparator");
      if (typeof decimalSeparator === "string") {
        // Single separator.
        assert(decimalSeparator.length === 1, message(1002));
        let separator = decimalSeparator;
        if (thousandsSeparators instanceof Array &&
            indexOf(thousandsSeparators, separator) >= 0) {
          // There is a conflict between the decimal separator and the
          // thousands separator.
          assert(false, message(1008, [separator]));
        }
        return ch === separator;
      }
      if (decimalSeparator instanceof Array) {
        // Multiple separators.
        forEach(decimalSeparator, function (separator) {
          if (thousandsSeparators instanceof Array &&
              indexOf(thousandsSeparators, separator) >= 0) {
            // There is a conflict between the decimal separator and the
            // thousands separator.
            assert(false, message(1008, [separator]));
          }
        });
        return indexOf(decimalSeparator, ch) >= 0;
      }
      if (thousandsSeparators instanceof Array && indexOf(thousandsSeparators, '.') >= 0) {
        // Period is used as a thousands separator, so cannot be used as a
        // decimal separator.
        assert(false, message(1008));
        return false;
      }
      // Otherwise, period is used as the decimal separator.
      return ch === ".";
    }

    // Construct a number node.
    function numberNode(n0, doScale, roundOnly) {
      // doScale - scale n if true
      // roundOnly - only scale if rounding
      let ignoreTrailingZeros = Model.option("ignoreTrailingZeros");
      let n1 = n0.toString();
      let n2 = "";
      let i, ch;
      let lastSeparatorIndex, lastSignificantIndex;
      let separatorCount = 0;
      let numberFormat = "integer";
      let hasLeadingZero, hasTrailingZero;
      if (n0 === ".") {
        assert(false, message(1004, [n0, n0.charCodeAt(0)]));
      }
      for (i = 0; i < n1.length; i++) {
        if (matchThousandsSeparator(ch = n1.charAt(i))) {
          if (separatorCount && lastSeparatorIndex !== i - 4 ||
              !separatorCount && i > 4) {
            assert(false, message(1005));
          }
          lastSeparatorIndex = i;
          separatorCount++;
          // We erase separators so 1,000 and 1000 are equivLiteral.
        } else {
          if (matchDecimalSeparator(ch)) {
            if (numberFormat === "decimal") {
              assert(false, message(1007, [ch, n2 + ch]));
            }
            ch = '.';
            numberFormat = "decimal";
            if (separatorCount && lastSeparatorIndex !== i - 4) {
              assert(false, message(1005));
            }
            if (n2 === "0") {
              hasLeadingZero = true;
            }
            lastSignificantIndex = n2.length;
            lastSeparatorIndex = i;  // Used for thousandths separators
            separatorCount++;
          } else if (numberFormat === "decimal") {
            if (ch !== "0") {
              lastSignificantIndex = n2.length;
            }
          }
          n2 += ch;
        }
      }
      if (numberFormat !== "decimal" && lastSeparatorIndex && lastSeparatorIndex !== i - 4) {
        // If we haven't seen a decimal separator, then make sure the last thousands
        // separator is in the right place.
        assert(false, message(1005));
      }
      if (lastSignificantIndex !== undefined) {
        if (lastSignificantIndex + 1 < n2.length) {
          hasTrailingZero = true;
        }
        if (ignoreTrailingZeros) {
          n2 = n2.substring(0, lastSignificantIndex + 1);
          if (n2 === ".") {
            // ".0" -> "." -> "0"
            n2 = "0";
          }
        }
      }
      return {
        op: Model.NUM,
        args: [String(n2)],
        hasThousandsSeparator: separatorCount !== 0,
        numberFormat: numberFormat,
        hasLeadingZero: hasLeadingZero,
        hasTrailingZero: hasTrailingZero
      }
    }
    // Construct a multiply node.
    function multiplyNode(args, flatten) {
      return binaryNode(Model.MUL, args, flatten);
    }
    // Construct a unary node.
    function unaryNode(op, args) {
      assert(args.length === 1, "Wrong number of arguments for unary node");
      return newNode(op, args);
    }
    // Construct a binary node.
    function binaryNode(op, args, flatten) {
      assert(args.length > 1, "Too few argument for binary node");
      let aa = [];
      forEach(args, function(n) {
        if (flatten && n.op === op) {
          aa = aa.concat(n.args);
        } else {
          aa.push(n);
        }
      });
      return newNode(op, aa);
    }

    let nodeOne = numberNode("1");
    let nodeMinusOne = unaryNode(Model.SUB, [numberNode("1")]);
    let nodeNone = newNode(Model.NONE, [numberNode("0")]);
    let nodeEmpty = newNode(Model.VAR, [""]);

    //
    // PARSER
    //
    // Manage the token stream.
    let scan = scanner(src);
    // Prime the token stream.
    function start(options) {
      T0 = scan.start(options);
    }
    // Get the current token.
    function hd() {
      return T0;
    }
    // Get the current lexeme.
    function lexeme() {
      return scan.lexeme();
    }
    // Advance the next token.
    function next(options) {
      T0 = T1;
      T1 = TK_NONE;
      if (T0 === TK_NONE) {
        T0 = scan.start(options);
      }
    }
    function lookahead(options) {
      if (T1 === TK_NONE) {
        T1 = scan.start(options);
      }
      return T1;
    }
    // Consume the current token if it matches, otherwise throw.
    function eat(tc, options) {
      let tk = hd();
      if (tk !== tc) {
        let expected = String.fromCharCode(tc);
        let found = tk ? String.fromCharCode(tk) : "EOS";
        assert(false, message(1001, [expected, found]));
      }
      next(options);
    }
    // Begin parsing functions.
    function isSimpleFraction(node) {
      if (node.op === Model.FRAC) {
        let n0 = node.args[0];
        let n1 = node.args[1];
        return (
          n0.op === Model.NUM && n0.numberFormat === "integer" &&
          n1.op === Model.NUM && n1.numberFormat === "integer"
        );
      }
      return false;
    }
    function isMinusOne(node) {
      // Check for a "-1" literal.
      return node.op === Model.SUB &&
        node.args.length === 1 &&
        node.args[0].op === Model.NUM &&
        node.args[0].args.length === 1 &&
        node.args[0].args[0] === "1";
    }

    function primaryExpr() {
      let t, node, tk, op, base, args, expr1, expr2;
      switch ((tk=hd())) {
      case 'A'.charCodeAt(0):
      case 'a'.charCodeAt(0):
      case TK_VAR:
        args = [lexeme()];
        next();
        // // Collect the subscript if there is one. Subscripts make multipart variable names.
        // if ((t=hd())===TK_UNDERSCORE) {
        //   next({oneCharToken: true});
        //   args.push(primaryExpr());   // {op:VAR, args:["Fe", "2"]}
        // }
        node = newNode(Model.VAR, args);
        if (isChemCore()) {
          if (hd() === TK_LEFTBRACE && lookahead() === TK_RIGHTBRACE) {
            // C_2{}^3 -> C_2^3
            eat(TK_LEFTBRACE);
            eat(TK_RIGHTBRACE);
          }
        }
        break;
      case TK_NUM:
        node = numberNode(lexeme());
        next();
        break;
      case TK_TYPE:
        node = newNode(Model.TYPE, [newNode(Model.VAR, [lexeme()])]);
        next();
        break;
      case TK_LEFTBRACKET:
      case TK_LEFTPAREN:
        node = parenExpr(tk);
        break;
      case TK_LEFTBRACE:
        node = braceExpr();
        break;
      case TK_BEGIN:
        next();
        let figure = braceExpr();
        let tbl = matrixExpr();
        eat(TK_END);
        braceExpr();
        if (indexOf(figure.args[0], "matrix") >= 0) {
          node = newNode(Model.MATRIX, [tbl]);
        } else {
          assert(false, "Unrecognized LaTeX name");
        }
        break;
      case TK_VERTICALBAR:
        node = absExpr();
        break;
      case TK_ABS:
        next();
        node = unaryNode(Model.ABS, [braceExpr()]);
        break;
      case TK_FRAC:
        next();
        expr1 = braceExpr();
        expr2 = braceExpr();
        node = newNode(Model.FRAC, [expr1, expr2]);
        node.isFraction = isSimpleFraction(node);
        break;
      case TK_BINOM:
        next();
        let n = braceExpr();
        let k = braceExpr();
        // (n k) = \frac{n!}{k!(n-k)!}
        let num = unaryNode(Model.FACT, [n]);
        let den = binaryNode(Model.POW, [
          binaryNode(Model.MUL, [
            unaryNode(Model.FACT, [k]),
            unaryNode(Model.FACT, [binaryNode(Model.ADD, [n, negate(k)])])
          ]),
          nodeMinusOne
        ]);
        node = binaryNode(Model.MUL, [num, den]);
        node.isBinomial = true;
        break;
      case TK_SQRT:
        next();
        switch(hd()) {
        case TK_LEFTBRACKET:
          let root = bracketExpr();
          base = braceExpr();
          node = newNode(Model.SQRT, [base, root]);
          break;
        case TK_LEFTBRACE:
          base = braceExpr();
          node = newNode(Model.SQRT, [base, newNode(Model.NUM, ["2"])]);
          break;
        default:
          assert(false, message(1001, ["{ or (", String.fromCharCode(hd())]));
          break;
        }
        break;
      case TK_VEC:
        next();
        let name = braceExpr();
        node = newNode(Model.VEC, [name]);
        break;
      // case TK_SIN:
      // case TK_COS:
      // case TK_TAN:
      // case TK_SEC:
      // case TK_COT:
      // case TK_CSC:
      //   next();
      //   let t;
      //   args = [];
      //   // Collect exponents if there are any
      //   while ((t=hd())===TK_CARET) {
      //     next({oneCharToken: true});
      //     args.push(unaryExpr());
      //   }
      //   if (args.length === 1 && isMinusOne(args[0])) {
      //     // Special case for sin^{-1} and friends.
      //     op = "arc" + tokenToOperator[tk];
      //     args = [];
      //   } else {
      //     op = tokenToOperator[tk];
      //   }
      //   args.unshift(newNode(op, [postfixExpr()]));
      //   if (args.length > 1) {
      //     return newNode(Model.POW, args);
      //   } else {
      //     return args[0];
      //   }
      //   break;
      // case TK_ARCSIN:
      // case TK_ARCCOS:
      // case TK_ARCTAN:
      // case TK_ARCSEC:
      // case TK_ARCCOT:
      // case TK_ARCCSC:
      //   next();
      //   args = [];
      //   // Collect exponents if there are any
      //   while ((t=hd())===TK_CARET) {
      //     next({oneCharToken: true});
      //     args.push(unaryExpr());
      //   }
      //   args.unshift(newNode(tokenToOperator[tk], [primaryExpr()]));
      //   if (args.length > 1) {
      //     return newNode(Model.POW, args);
      //   } else {
      //     return args[0];
      //   }
      //   break;
      // case TK_LN:
      //   next();
      //   return newNode(Model.LOG, [newNode(Model.VAR, ["e"]), primaryExpr()]);
      // case TK_LG:
      //   next();
      //   return newNode(Model.LOG, [newNode(Model.NUM, ["10"]), primaryExpr()]);
      // case TK_LOG:
      //   next();
      //   args = [];
      //   // Collect the subscript if there is one
      //   if ((t=hd())===TK_UNDERSCORE) {
      //     next({oneCharToken:true});
      //     args.push(primaryExpr());
      //   } else {
      //     args.push(newNode(Model.VAR, ["e"]));    // default to natural log
      //   }
      //   args.push(primaryExpr());
      //   // Finish the log function
      //   return newNode(Model.LOG, args);
      //   break;
      case TK_LIM:
        next();
        args = [];
        // Collect the subscript and expression
        eat(TK_UNDERSCORE);
        args.push(primaryExpr());
        args.push(primaryExpr());
        // Finish the log function
        return newNode(tokenToOperator[tk], args);
        break;
      case TK_SUM:
      case TK_INT:
      case TK_PROD:
      case TK_CUP:
      case TK_BIGCUP:
      case TK_CAP:
      case TK_BIGCAP:
        next();
        args = [];
        // Collect the subscript and expression
        if (hd() === TK_UNDERSCORE) {
          next({oneCharToken: true});
          args.push(primaryExpr());
          eat(TK_CARET, {oneCharToken: true});              // If we have a subscript, then we expect a superscript
          args.push(primaryExpr());
        }
        if (hd()) {
          args.push(commaExpr());
        }
        // Finish the log function
        return newNode(tokenToOperator[tk], args);
        break;
      case TK_EXISTS:
        next();
        return newNode(Model.EXISTS, [equalExpr()]);
      case TK_FORALL:
      case TK_RIGHTARROW:
      case TK_LEFTARROW:
      case TK_LONGRIGHTARROW:
      case TK_LONGLEFTARROW:
      case TK_OVERRIGHTARROW:
      case TK_OVERLEFTARROW:
      case TK_LONGLEFTRIGHTARROW:
      case TK_OVERLEFTRIGHTARROW:
        next();
        return newNode(tokenToOperator[tk], [commaExpr()]);
      case TK_EXP:
        next();
        return newNode(Model.EXP, [additiveExpr()]);
      case TK_M:
        next();
        return newNode(Model.M, [multiplicativeExpr()]);
      case TK_OVERLINE:
      case TK_DOT:
      case TK_MATHFIELD:
        next();
        return newNode(tokenToOperator[tk], [braceExpr()]);
      case TK_OVERSET:
      case TK_UNDERSET:
        next();
        expr1 = braceExpr();
        expr2 = braceExpr();
        // Add the annotation to the variable.
        expr2.args.push(newNode(tokenToOperator[tk], [expr1]));
        return expr2;
        break;
      case TK_MATHBF:
        // Erase this token.
        next();
        expr1 = braceExpr();
        return expr1;
      case TK_QMARK:
        next();
        return newNode(Model.VAR, ["?"]);
      default:
        assert(!Model.option("strict"), message(1006, [tokenToOperator[tk]]));
        node = nodeEmpty;
        break;
      }
      return node;
    }
    // Parse '1 & 2 & 3 \\ a & b & c'
    function matrixExpr( ) {
      let args = [];
      let node, t;
      args.push(rowExpr());
      while ((t = hd()) === TK_NEWROW) {
        next();
        args.push(rowExpr());
      }
      return newNode(tokenToOperator[TK_NEWROW], args);
    }
    // Parse '1 & 2 & 3'
    function rowExpr( ) {
      let args = [];
      let t;
      args.push(equalExpr());
      while ((t = hd()) === TK_NEWCOL) {
        next();
        args.push(equalExpr());
      }
      return newNode(tokenToOperator[TK_NEWCOL], args);
    }
    // Parse '| expr |'
    function absExpr() {
      eat(TK_VERTICALBAR);
      let e = additiveExpr();
      eat(TK_VERTICALBAR);
      return unaryNode(Model.ABS, [e]);
    }
    // Parse '{ expr }'
    function braceExpr() {
      let node;
      eat(TK_LEFTBRACE);
      if (hd() === TK_RIGHTBRACE) {
        eat(TK_RIGHTBRACE);
        node = newNode(Model.COMMA, []);
      } else {
        node = commaExpr();
        eat(TK_RIGHTBRACE);
      }
      node.lbrk = TK_LEFTBRACE;
      node.rbrk = TK_RIGHTBRACE;
      return node;
    }
    // Parse '[ expr ]'
    function bracketExpr() {
      eat(TK_LEFTBRACKET);
      let e = commaExpr();
      eat(TK_RIGHTBRACKET);
      return e;
    }
    // Parse '( expr )' and '( expr ]' and '[ expr )' and '[ expr ]'
    function parenExpr(tk) {
      // Handle grouping and intervals.
      let e;
      let tk2;
      eat(tk);
      if (hd() === TK_RIGHTPAREN || hd() === TK_RIGHTBRACKET) {
        eat(tk === TK_LEFTPAREN ? TK_RIGHTPAREN : TK_RIGHTBRACKET);
        e = newNode(Model.COMMA, []);
      } else {
        e = commaExpr();
        // (..], [..], [..), (..)
        eat(tk2 = hd() === TK_RIGHTPAREN ? TK_RIGHTPAREN : TK_RIGHTBRACKET);
      }
      // intervals: (1, 3), [1, 3], [1, 3), (1, 3]
      if (e.args.length === 2 &&
          (tk === TK_LEFTPAREN || tk === TK_LEFTBRACKET) &&
          (tk2 === TK_RIGHTPAREN || tk2 === TK_RIGHTBRACKET)) {
        // Make bracket tokens part of the node for comparision.
        //e.args.push(numberNode(tk));
        //e.args.push(numberNode(tk2));
        e = newNode(Model.PAREN, [e]);
      } else if (tk === TK_LEFTPAREN || tk === TK_LEFTBRACKET) {
        e = newNode(Model.PAREN, [e]);
      }
      // Save the brackets as attributes on the node for later use.
      e.lbrk = tk;
      e.rbrk = tk2;
      return e;
    }
    // Parse 'x^2'
    function exponentialExpr() {
      let t, args = [primaryExpr()];
      while ((t=hd())===TK_CARET) {
        next({oneCharToken: true});
        let t;
        if ((isMathSymbol(args[0]) || isChemCore()) &&
            ((t = hd()) === TK_ADD || t === TK_SUB)) {
          next();
          // Na^+
          args.push(unaryNode(tokenToOperator[t], [nodeOne]));
        } else {
          let n = unaryExpr();
          if (n.op === Model.VAR && n.args[0] === "\\circ") {
            // 90^{\circ} -> degree 90
            if (hd() === TK_VAR &&
                lexeme() === "K" || lexeme() === "C" || lexeme() === "F") {
              n = multiplyNode([
                args.pop(),
                unaryNode(Model.VAR, ["\\degree " + lexeme()])]);
              next();
            } else {
              n = multiplyNode([
                args.pop(),
                unaryNode(Model.VAR, ["\\degree"])
              ]);
            }
            args.push(n);
          } else {
            // x^2
            args.push(n);
          }
        }
      }
      if (args.length > 1) {
        let expo = args.pop();
        forEach(args.reverse(), function (base) {
          expo = newNode(Model.POW, [base, expo]);
        });
        return expo;
      } else {
        return args[0];
      }
    }
    // Parse '10%', '4!'
    function postfixExpr() {
      let t;
      let expr = exponentialExpr();
      switch (t = hd()) {
      case TK_PERCENT:
        next();
        expr = newNode(Model.PERCENT, [expr]);
        break;
      case TK_BANG:
        next();
        expr = newNode(Model.FACT, [expr]);
        break;
      default:
        if (t === TK_VAR && lexeme() === "\\degree") {
          next();
          if (hd() === TK_VAR && (lexeme() === "K" || lexeme() === "C" || lexeme() === "F")) {
            expr = multiplyNode([
              expr,
              unaryNode(Model.VAR, ["\\degree " + lexeme()])]);
            next();
          } else {
            expr = multiplyNode([
              expr,
              unaryNode(Model.VAR, ["\\degree"])
            ]);
          }
        } else if (t === TK_VERTICALBAR && lookahead() === TK_UNDERSCORE) {
          // x|_{x=3}, x|_1^2
          next();
          let args = [expr];
          next({oneCharToken: true});
          args.push(newNode(Model.SUBSCRIPT, [equalExpr()]));
          expr = newNode(Model.PIPE, args);
        } else if (isChemCore() && (t === TK_ADD || t === TK_SUB) && lookahead() === TK_RIGHTBRACE) {
          next();
          // 3+, ion
          expr = unaryNode(tokenToOperator[t], [expr]);
        } // Otherwise we're in the middle of a binary expr.
        break;
      }
      return expr;
    }
    // Parse '+x', '\pm y'
    function unaryExpr() {
      let t, expr, op;
      switch (t = hd()) {
      case TK_ADD:
      case TK_NOT:
      case TK_SUB:
        next();
        expr = newNode(tokenToOperator[t], [unaryExpr()]);
        break;
      case TK_PM:
        next();
        expr = unaryExpr();
        expr = newNode(tokenToOperator[t], [expr]);
        break;
      case TK_UNDERSCORE:
        // _1, _1^2, _+^-
        op = tokenToOperator[t];
        next({oneCharToken: true});
        if ((t = hd()) === TK_ADD || t === TK_SUB) {
          next();
          // ^+, ^-
          expr = nodeOne;
        } else {
          expr = unaryExpr();
        }
        expr = newNode(op, [expr]);
        if ((t = hd()) === TK_CARET) {
          let args = [expr];
          // _1, _1^2, _+^-
          op = tokenToOperator[t];
          next({oneCharToken: true});
          if ((t = hd()) === TK_ADD || t === TK_SUB) {
            next();
            // ^+, ^-
            expr = nodeOne;
          } else {
            expr = unaryExpr();
          }
          args.push(expr);
          expr = newNode(op, args);
        }
        break;
      case TK_CARET:
        op = tokenToOperator[t];
        next({oneCharToken: true});
        if ((t = hd()) === TK_ADD || t === TK_SUB) {
          next();
          // ^+, ^-
          expr = nodeOne;
        } else {
          expr = unaryExpr();
        }
        expr = newNode(op, [expr]);
        break;
      default:
        if (t === TK_VAR && lexeme() === "$") {
          next();
          if (hd()) {
            // Give $1 a higher precedence than ordinary multiplication.
            expr = multiplyNode([newNode(Model.VAR, ["$"]), postfixExpr()]);
            expr.args[1].isPolynomial = true;
          } else {
            // Standalone "$". Probably not useful but we had a test case for it.
            expr = newNode(Model.VAR, ["$"]);
          }
        } else {
          expr = postfixExpr();
        }
        break;
      }
      return expr;
    }
    // Parse 'x_2'
    function subscriptExpr() {
      let t, args = [unaryExpr()];
      if ((t=hd())===TK_UNDERSCORE) {
        next({oneCharToken: true});
        args.push(exponentialExpr());
        if (isChemCore()) {
          if (hd() === TK_LEFTBRACE) {
            // C_2{}^3 -> C_2^3
            eat(TK_LEFTBRACE);
            eat(TK_RIGHTBRACE);
          }
        }
      }
      if (args.length > 1) {
        return newNode(Model.SUBSCRIPT, args);
      } else {
        return args[0];
      }
    }
    // Parse '1/2/3/4'
    function fractionExpr() {
      let t, node = subscriptExpr();
      while ((t=hd())===TK_SLASH || t === TK_COLON) {
        next();
        node = newNode(tokenToOperator[t], [node, subscriptExpr()]);
        node.isFraction = isSimpleFraction(node);
      }
      return node;
    }
    //
    function isChemSymbol(n) {
      let id;
      if (n.op === Model.VAR) {
        id = n.args[0];
      } else if (n.op === Model.POW) {
        id = n.args[0].args[0];
      } else {
        return false;
      }
      let sym = Model.env[id];
      return sym && sym.mass ? true : false;   // Has mass so must be (?) a chem symbol.
    }
    //
    function isMathSymbol(n) {
      if (n.op !== Model.VAR) {
        return false;
      }
      let sym = Model.env[n.args[0]];
      return sym && sym.name ? true : false;    // This is somewhat ad hoc, update as needed
    }
    //
    function isVar(n, id) {
      assert(typeof id === "undefined" || typeof id === "string", "Internal error in 'isVar()'");
      if (n.op !== Model.VAR) {
        return false;
      }
      return id === undefined ? true : n.args[0] === id;
    }
    // Parse 'a \times b', 'a * b'
    function isOneOrMinusOne(node) {
      return isOne(node) || isMinusOne(node);
    }
    function isOne(node) {
      return node.op === Model.NUM && node.args[0] === "1"
    }
    function isMinusOne(node) {
      return node.op === Model.SUB && node.args.length === 1 && isOne(node.args[0]);
    }

    function multiplicativeExpr() {
      var t, expr, explicitOperator = false, isFraction, args = [];
      var n0;
      expr = fractionExpr();
      if (expr.op === Model.MUL &&
          !expr.isBinomial &&
          expr.args[expr.args.length - 1].op !== Model.VAR &&
          expr.args[expr.args.length - 1].args[0] === "\\degree") {
        // FIXME binomials and all other significant syntax should not be desugared
        // during parsing. It breaks equivLiteral and equivSyntax.
        args = expr.args;
      } else {
        args = [expr];
      }
      // While lookahead is not a lower precedent operator
      // FIXME need a better way to organize this condition
      while((t = hd()) && !isAdditive(t) && !isRelational(t) && !isImplies(t) &&
            t !== TK_COMMA && !isEquality(t) && t !== TK_RIGHTBRACE &&
            t !== TK_RIGHTPAREN && t !== TK_RIGHTBRACKET &&
            t !== TK_RIGHTARROW && t !== TK_LT && t !== TK_VERTICALBAR &&
            t !== TK_NEWROW && t !== TK_NEWCOL && t !== TK_END) {
        explicitOperator = false;
        if (isMultiplicative(t)) {
          next();
          explicitOperator = true;
        }
        expr = fractionExpr();
        if (t === TK_DIV || t === TK_DOT) {
          expr = newNode(tokenToOperator[t], [args.pop(), expr]);
        }
        assert(explicitOperator ||
               args.length === 0 ||
               expr.lbrk ||
               args[args.length-1].op !== Model.NUM ||
               args[args.length-1].lbrk ||
               isRepeatingDecimal([args[args.length-1], expr]) ||
               expr.op !== Model.NUM, message(1010));
        if (isChemCore() && t === TK_LEFTPAREN && isVar(args[args.length-1], "M")) {
          // M(x) -> \M(x)
          args.pop();
          expr = unaryNode(Model.M, [expr]);
        } else if (!explicitOperator) {
          if (args.length > 0 &&
              isMixedFraction(args[args.length-1], expr)) {
            // 3 \frac{1}{2} -> 3 + \frac{1}{2}
            t = args.pop();
            if (isNeg(t)) {
              expr = binaryNode(Model.MUL, [nodeMinusOne, expr]);
            }
            expr = binaryNode(Model.ADD, [t, expr]);
            expr.isMixedFraction = true;
          } else if (Model.option("ignoreCoefficientOne") &&
                     args.length === 1 && isOneOrMinusOne(args[0]) &&
                     isPolynomialTerm(args[0], expr)) {
            // 1x -> x
            if (isOne(args[0])) {
              args.pop();
            } else {
              expr = negate(expr);
            }
          } else if (args.length > 0 &&
                     (n0 = isRepeatingDecimal([args[args.length-1], expr]))) {
            args.pop();
            expr = n0;
          } else if (expr.op === Model.VAR &&
                     expr.args[0].indexOf("'") === 0) {
            var t = args.pop();
            expr = binaryNode(Model.MUL, [t, expr]);
            expr.isImplicit = true;
          } else if (!isChemCore() && isPolynomialTerm(args[args.length-1], expr)) {
            // 2x, -3y but not CH (in chem)
            expr.isPolynomial = true;
            var t = args.pop();
            if (!t.isPolynomial) {
              expr = binaryNode(Model.MUL, [t, expr]);
              expr.isImplicit = t.isImplicit;
              t.isImplicit = undefined;
            } else {
              args.push(t);
            }
          } else {
            // 2(x), (y+1)z
            expr.isImplicit = true;
          }
        } else if (t === TK_MUL && args.length > 0 &&
                   isScientific([args[args.length-1], expr])) {
          // 1.2 \times 10 ^ {-3}
          t = args.pop();
          if (isNeg(t)) {
            expr = binaryNode(Model.MUL, [nodeMinusOne, expr]);
          }
          expr = binaryNode(Model.MUL, [t, expr]);
          expr.isScientific = true;
        }
        if (expr.op === Model.MUL &&
            !expr.isScientific &&
            !expr.isBinomial && args.length &&
            !args[args.length-1].isImplicit &&
            !args[args.length-1].isPolynomial &&
            expr.isImplicit &&
            expr.isPolynomial) {
          args = args.concat(expr.args);
        } else {
          args.push(expr);
        }
      }
      if (args.length > 1) {
        return binaryNode(Model.MUL, args);
      } else {
        return args[0];
      }
      //
      function isMultiplicative(t) {
        return t === TK_MUL || t === TK_DIV || t === TK_SLASH || t === TK_DOT;
        // / is only multiplicative for parsing
      }
    }

    function isNumber(n) {
      return n.op === Model.NUM;
    }

    function isMixedFraction(n0, n1) {
      // 3\frac{1}{2} but not 3(\frac{1}{2}) or 3 1.0/2
      if (n0.op === Model.SUB && n0.args.length === 1) {
        n0 = n0.args[0];
      }
      if (!n0.lbrk && !n1.lbrk &&
          n0.op === Model.NUM &&
          isSimpleFraction(n1)) {
        return true;
      }
      return false;
    }

    function isPolynomialTerm(n0, n1) {
      // 3x but not 3(x)
      if (n0.op === Model.SUB && n0.args.length === 1) {
        n0 = n0.args[0];
      }
      if (!n0.lbrk && !n1.lbrk &&
          (n0.op === Model.NUM && isVar(n1) ||
           isVar(n0) && n1.op === Model.NUM ||
           n0.op === Model.NUM && n1.op === Model.NUM ||
           isVar(n0) && isVar(n1) ||
           n0.op === Model.MUL && n0.args[n0.args.length-1].isPolynomial && (isVar(n1) || n1.op === Model.NUM))) {
        return true;
      }
      return false;
    }

    function isInteger(node) {
      let n;
      if (node.op === Model.NUM) {
        n = node.args[0];
      } else {
        n = node;
      }
      return !isNaN(parseInt(n));
    }

    function isRepeatingDecimal(args) {
      // "3." "\overline{..}"
      // "3." "(..)"
      // "3." "\dot{..}"
      let expr, n0, n1;
      // if (args[0].isRepeating) {
      //   // We already have a repeating decimal so append additional digits to it.
      //   let n = args[0].op === Model.ADD && args[0].args[1].op === Model.NUM
      //     ? args[0].args[1]
      //     : args[0];
      //   console.log("isRepeating() n=" + JSON.stringify(n, null, 2));
      //   assert(n.op === Model.NUM || n.op === Model.VAR && n.args[0] === "?");
      //   let arg1;
      //   if (args[1].op === Model.DOT) {
      //     assert(args[1].args[0].op === Model.NUM);
      //     arg1 = numberNode(n.args[0] + args[1].args[0].args[0]);
      //   } else {
      //     assert(args[1].op === Model.NUM);
      //     arg1 = numberNode(n.args[0] + args[1].args[0]);
      //   }
      //   arg1.isRepeating = true;
      //   if (args[0].op === Model.ADD) {
      //     args[0].args[1] = arg1;
      //     expr = args[0];
      //   } else {
      //     expr = arg1;
      //   }
      // } else
      if (!args[0].lbrk &&
          (args[0].op === Model.NUM && args[0].numberFormat === "decimal" ||
           args[0].op === Model.VAR && args[0].args[0] === "?")) {
        // No lbrk so we are in the same number literal.
        if (args[1].lbrk === 40 && isInteger(args[1])) {
          n0 = args[0];
          n1 = args[1];
        } else if (!args[1].lbrk && args[1].op === Model.OVERLINE) {
        //   // 3.\overline{12} --> 3.0+(0.12, repeating)
        //   // 0.3\overline{12} --> 0.3+0.1*(.12, repeating)
          n0 = args[0];
          n1 = args[1]; //.args[0];
        } else if (!args[1].lbrk && args[1].op === Model.DOT) {
          // 3.\dot{1}\dot{2} --> 3.0+(0.12, repeating)
          // 0.3\overline{12} --> 0.3+0.1*(.12, repeating)
          n0 = args[0];
          n1 = args[1]; //.args[0];
        } else {
          return null;
        }
        // n1 = numberNode("." + n1.args[0]);
        n1.isRepeating = true;
        // if (indexOf(n0.args[0], ".") >= 0) {
        //   let decimalPlaces = n0.args[0].length - indexOf(n0.args[0], ".")- 1;
        //   n1 = multiplyNode([n1, binaryNode(Model.POW, [numberNode("10"), numberNode("-" + decimalPlaces)])]);
        // }
        // if (n0.op === Model.NUM && +n0.args[0] === 0) {
        //   // 0.\overline{..} or 0.00\overline{..}. Leading zero, so don't add it.
        //   expr = n1;
        // } else {
          expr = binaryNode(Model.ADD, [n0, n1]);
        // }
        expr.numberFormat = "decimal";
        expr.isRepeating = true;
      } else {
        expr = null;
      }
      return expr;
    }

    function isScientific(args) {
      if (args.length === 1) {
        // 1.2, 10^2
        if (args[0].op === Model.NUM &&
            (args[0].args[0].length === 1 || indexOf(args[0].args[0], ".") === 1)) {
          return true;
        } else if (args[0].op === Model.POW &&
                   args[0].args[0].op === Model.NUM && args[0].args[0].args[0] === "10" &&
                   args[0].args[1].numberFormat === "integer") {
          return true;
        }
        return false;
      } else if (args.length === 2) {
        // 1.0 \times 10 ^ 1
        let a = args[0];
        let e = args[1];
        if (a.op === Model.NUM &&
            (a.args[0].length === 1 || indexOf(a.args[0], ".") === 1) &&
            e.op === Model.POW &&
            e.args[0].op === Model.NUM && e.args[0].args[0] === "10" &&
            e.args[1].numberFormat === "integer") {
          return true;
        }
        return false;
      }
    }

    function isNeg(n) {
      if (typeof n === "number") {
        return n < 0;
      } else if (n.args.length===1) {
        return n.op === OpStr.SUB && n.args[0].args[0] > 0 ||  // is unary minus
               n.op === Model.NUM && +n.args[0] < 0;           // is negative number
      } else if (n.args.length===2) {
        return n.op===OpStr.MUL && isNeg(n.args[0]);  // leading term is neg
      }
    }
    // Return the numeric inverse of the argument.
    function negate(n) {
      if (typeof n === "number") {
        return -n;
      } else if (n.op === Model.MUL) {
        let args = n.args.slice(0); // copy
        return multiplyNode([negate(args.shift())].concat(args));
      } else if (n.op === Model.POW && isMinusOne(n.args[1])) {
        return binaryNode(Model.POW, [negate(n.args[0]), nodeMinusOne]);
      }
      return unaryNode(Model.SUB, [n]);
    }
    //
    function isAdditive(t) {
      return t === TK_ADD || t === TK_SUB || t === TK_PM || t === TK_BACKSLASH;
    }
    // Parse 'a + b'
    function additiveExpr() {
      let expr = multiplicativeExpr();
      let t;
      while (isAdditive(t = hd())) {
        next();
        let expr2 = multiplicativeExpr();
        switch(t) {
        case TK_BACKSLASH:
          expr = binaryNode(Model.BACKSLASH, [expr, expr2]);
          break;
        case TK_PM:
          expr = binaryNode(Model.PM, [expr, expr2]);
          break;
        case TK_SUB:
          expr = binaryNode(Model.SUB, [expr, expr2]);
          break;
        default:
          expr = binaryNode(Model.ADD, [expr, expr2]);
          break;
        }
      }
      return expr;
    }
    //
    function isRelational(t) {
      return t === TK_LT || t === TK_LE || t === TK_GT || t === TK_GE ||
             t === TK_IN || t === TK_TO || t === TK_PERP || t === TK_PROPTO ||
             t === TK_NGTR || t === TK_NLESS || t === TK_NI || t === TK_NOT ||
             t === TK_SUBSETEQ || t === TK_SUPSETEQ ||
             t === TK_SUBSET || t === TK_SUPSET ||
             t === TK_PARALLEL || t === TK_NPARALLEL || t === TK_SIM || t === TK_CONG;
    }
    // Parse 'x < y'
    function relationalExpr() {
      let t = hd();
      let expr = additiveExpr();
      let args = [];
      let isNot = false;
      while (isRelational(t = hd())) {
        // x < y < z -> [x < y, y < z]
        next();
        if (t === TK_NOT) {
          // Remember it and continue.
          isNot = true;
          continue;
        }
        let expr2 = additiveExpr();
        expr = newNode(tokenToOperator[t], [expr, expr2]);
        if (isNot) {
          // Modify with not.
          expr.op = "n" + expr.op; // Negate the operator: subset --> nsubset.
          isNot = false;
        }
        args.push(expr);
        // Make a copy of the reused node.
        expr = Model.create(expr2);
      }
      if (args.length === 0) {
        expr = expr;
      } else if (args.length === 1) {
        expr = args[0];
      } else {
        expr = newNode(Model.COMMA, args);
      }
      return expr;
    }
    // Parse 'x = 10'
    function isEquality(t) {
      return t === TK_EQL || t === TK_NE || t === TK_APPROX;
    }
    function equalExpr() {
      let expr = relationalExpr();
      let t;
      let args = [];
      while (isEquality(t = hd())) {
        // x = y = z -> [x = y, y = z]
        next();
        let expr2 = additiveExpr();
        expr = newNode(tokenToOperator[t], [expr, expr2]);
      }
      return expr;
    }
    function isImplies(t) {
      return t === TK_IMPLIES || t === TK_RIGHTARROW || t === TK_LEFTARROW ||
             t === TK_LONGRIGHTARROW || t === TK_LONGLEFTARROW || t === TK_OVERRIGHTARROW ||
             t === TK_OVERLEFTARROW || t === TK_LONGLEFTRIGHTARROW || t === TK_OVERLEFTRIGHTARROW ||
             t === TK_VERTICALBAR;
    }
    function impliesExpr() {
      let expr = equalExpr();
      let t;
      let args = [];
      while (isImplies(t = hd())) {
        next();
        let expr2 = equalExpr();
        expr = newNode(tokenToOperator[t], [expr, expr2]);
      }
      return expr;
    }
    // Parse 'a, b, c, d'
    function commaExpr() {
      let expr = impliesExpr();
      let args = [expr];
      let t;
      while ((t = hd())===TK_COMMA) {
        next();
        args.push(impliesExpr());
      }
      if (args.length > 1) {
        expr = newNode(tokenToOperator[TK_COMMA], args);
      }
      return expr;
    }
    // Root syntax.
    function tokenize() {
      // Just return a list of lexemes.
      let args = [];
      start();
      while (hd()) {
        let lex = lexeme();
        args.push(newNode(hd(), lex ? [lex] : []));
        next();
      }
      let node = newNode(Model.COMMA, args);
      return node;
    }

    function expr() {
      start();
      if (hd()) {
        let n = commaExpr();
        if (n.lbrk === TK_LEFTBRACE &&
            n.rbrk === TK_RIGHTBRACE) {
          // Top level {..} is a set, so make a comma expr.
          n = newNode(Model.SET, [n]);
        }
        assert(!hd(), message(1003, [scan.pos(), scan.lexeme()]));
        return n;
      }
      // No meaningful input. Return a dummy node to avoid choking.
      return nodeNone;
    }
    // Return a parser object.
    return {
      expr: expr,
      tokenize: tokenize
    };
    //
    // SCANNER
    //
    // Find tokens in the input stream.
    //
    function scanner(src) {
      let curIndex = 0;
      let lexeme = "";
      let lexemeToToken = {
        "\\cdot": TK_DOT,
        "\\times": TK_MUL,
        "\\div": TK_DIV,
        "\\dfrac": TK_FRAC,
        "\\frac": TK_FRAC,
        "\\sqrt": TK_SQRT,
        "\\vec": TK_VEC,
        "\\pm": TK_PM,
        "\\not": TK_NOT,
        // "\\sin": TK_SIN,
        // "\\cos": TK_COS,
        // "\\tan": TK_TAN,
        // "\\sec": TK_SEC,
        // "\\cot": TK_COT,
        // "\\csc": TK_CSC,
        // "\\arcsin": TK_ARCSIN,
        // "\\arccos": TK_ARCCOS,
        // "\\arctan": TK_ARCTAN,
        // "\\arcsec": TK_ARCSEC,
        // "\\arccot": TK_ARCCOT,
        // "\\arccsc": TK_ARCCSC,
        // "\\ln": TK_LN,
        // "\\lg": TK_LG,
        // "\\log": TK_LOG,
        "\\left": null,  // whitespace
        "\\right": null,
        "\\big": null,
        "\\Big": null,
        "\\bigg": null,
        "\\Bigg": null,
        "\\ ": null,
        "\\quad": null,
        "\\qquad": null,
        "\\text": TK_TEXT,
        "\\textrm": TK_TEXT,
        "\\textit": TK_TEXT,
        "\\textbf": TK_TEXT,
        "\\lt": TK_LT,
        "\\le": TK_LE,
        "\\gt": TK_GT,
        "\\ge": TK_GE,
        "\\ne": TK_NE,
        "\\neq": TK_NE,
        "\\ngtr": TK_NGTR,
        "\\nless": TK_NLESS,
        "\\ni": TK_NI,
        "\\subseteq": TK_SUBSETEQ,
        "\\supseteq": TK_SUPSETEQ,
        "\\subset": TK_SUBSET,
        "\\supset": TK_SUPSET,
        "\\approx": TK_APPROX,
        "\\implies": TK_IMPLIES,
        "\\rightarrow": TK_RIGHTARROW,
        "\\leftarrow": TK_LEFTARROW,
        "\\longrightarrow": TK_LONGRIGHTARROW,
        "\\longleftarrow": TK_LONGLEFTARROW,
        "\\overrightarrow": TK_OVERRIGHTARROW,
        "\\overleftarrow": TK_OVERLEFTARROW,
        "\\longleftrightarrow": TK_LONGLEFTRIGHTARROW,
        "\\overleftrightarrow": TK_OVERLEFTRIGHTARROW,
        "\\perp": TK_PERP,
        "\\propto": TK_PROPTO,
        "\\parallel": TK_PARALLEL,
        "\\nparallel": TK_NPARALLEL,
        "\\sim": TK_SIM,
        "\\cong": TK_CONG,
        "\\exists": TK_EXISTS,
        "\\in": TK_IN,
        "\\forall": TK_FORALL,
        "\\lim": TK_LIM,
        "\\exp": TK_EXP,
        "\\to": TK_TO,
        "\\sum": TK_SUM,
        "\\int": TK_INT,
        "\\prod": TK_PROD,
        "\\cup": TK_CUP,
        "\\bigcup": TK_BIGCUP,
        "\\cap": TK_CAP,
        "\\bigcap": TK_BIGCAP,
        "\\%": TK_PERCENT,
        "\\binom": TK_BINOM,
        "\\begin": TK_BEGIN,
        "\\end": TK_END,
        "\\colon": TK_COLON,
        "\\vert": TK_VERTICALBAR,
        "\\lvert": TK_VERTICALBAR,
        "\\rvert": TK_VERTICALBAR,
        "\\mid": TK_VERTICALBAR,
        "\\type": TK_TYPE,
        "\\overline": TK_OVERLINE,
        "\\overset": TK_OVERSET,
        "\\underset": TK_UNDERSET,
        "\\backslash": TK_BACKSLASH,
        "\\mathbf": TK_MATHBF,
        "\\abs": TK_ABS,
        "\\dot": TK_DOT,
        "\\MathQuillMathField": TK_MATHFIELD,
        "\\ldots": TK_VAR,  // ... and var are close syntactic alternatives
        "\\vdots": TK_VAR,
        "\\ddots": TK_VAR,
      };
      let identifiers = keys(env);
      // Start scanning for one token.
      function start(options) {
        if (!options) {
          options = {};
        }
        let c;
        lexeme = "";
        while (curIndex < src.length) {
          switch ((c = src.charCodeAt(curIndex++))) {
          case 32:  // space
          case 9:   // tab
          case 10:  // new line
          case 13:  // carriage return
            continue;
          case 38:  // ampersand (new column or entity)
            if (indexOf(src.substring(curIndex), "nbsp;") === 0) {
              // Skip &nbsp;
              curIndex += 5;
              continue;
            }
            return TK_NEWCOL;
          case 92:  // backslash
            lexeme += String.fromCharCode(c);
            switch (src.charCodeAt(curIndex)) {
            case 92:
              curIndex++;
              return TK_NEWROW;   // double backslash = new row
            case 123: // left brace
            case 124: // vertical bar
            case 125: // right brace
              // Erase backslash.
              return src.charCodeAt(curIndex++);
            }
            let tk = latex();
            if (tk !== null) {
              return tk;
            }
            lexeme = "";
            continue;  // whitespace
          case 45:  // dash
            if (src.charCodeAt(curIndex) === 62) {
              curIndex++;
              return TK_RIGHTARROW;
            }
          case 33:  // bang, exclamation point
            if (src.charCodeAt(curIndex) === 61) { // equals
              curIndex++;
              return TK_NE;
            }
            return c; // char code is the token id
          case 37:  // percent
          case 40:  // left paren
          case 41:  // right paren
          case 42:  // asterisk
          case 43:  // plus
          case 44:  // comma
          case 47:  // slash
          case 58:  // colon
          case 61:  // equal
          case 63:  // question mark
          case 91:  // left bracket
          case 93:  // right bracket
          case 94:  // caret
          case 95:  // underscore
          case 123: // left brace
          case 124: // vertical bar
          case 125: // right brace
            lexeme += String.fromCharCode(c);
            return c; // char code is the token id
          case 36:  // dollar
            lexeme += String.fromCharCode(c);
            return TK_VAR;
          case 39:  // prime (single quote)
            return prime(c);
          case 60:  // left angle
            if (src.charCodeAt(curIndex) === 61) { // equals
              curIndex++;
              return TK_LE;
            }
            return TK_LT;
          case 62:  // right angle
            if (src.charCodeAt(curIndex) === 61) { // equals
              curIndex++;
              return TK_GE;
            }
            return TK_GT;
          default:
            if (isAlphaCharCode(c)) {
              return variable(c);
            } else if (matchDecimalSeparator(String.fromCharCode(c)) ||
                       isNumberCharCode(c)) {
              if (options.oneCharToken) {
                lexeme += String.fromCharCode(c);
                return TK_NUM;
              }
              return number(c);
            }
            else {
              assert(false, message(1004, [String.fromCharCode(c), c]));
              return 0;
            }
          }
        }
        return 0;
      }
      // Recognize 1, 1.2, 0.3, .3
      let lastSeparator;
      function number(c) {
        while (isNumberCharCode(c) ||
               matchDecimalSeparator(String.fromCharCode(c)) ||
               (lastSeparator = matchThousandsSeparator(String.fromCharCode(c), lastSeparator)) &&
               isNumberCharCode(src.charCodeAt(curIndex))) {  // Make sure the next char is a num.
          lexeme += String.fromCharCode(c);
          c = src.charCodeAt(curIndex++);
          if (c === 92 && src.charCodeAt(curIndex) === 32) {
            // Convert '\ ' to ' '.
            c = 32;
            curIndex++;
          }
        }
        if (lexeme === "." &&
            (indexOf(src.substring(curIndex), "overline") === 0 ||
             indexOf(src.substring(curIndex), "dot") === 0)) {
          // .\overline --> 0.\overline
          // .\dot --> 0.\dot
          lexeme = "0.";
        }
        curIndex--;
        return TK_NUM;
      }
      // Recognize x, cm, kg.
      function variable(c) {
        // Normal variables are a single character, but we treat units as
        // variables too so we need to scan the whole unit string as a variable
        // name.
        let ch = String.fromCharCode(c);
        lexeme += ch;
        // All single character names are valid variable lexemes. Now we check
        // for longer matches against unit names. The longest one wins.
        while (isAlphaCharCode((c=src.charCodeAt(curIndex++)))) {
          let ch = String.fromCharCode(c);
          let prefix = lexeme + ch;
          let match = some(identifiers, function (u) {
            return indexOf(u, prefix) === 0;
          });
          if (!match) {
            break;
          }
          lexeme += ch;
        }
        curIndex--;
        // // Scan trailing primes ('). This handles single character identifier
        // // with trailing primes.
        // while ((c=src.charCodeAt(curIndex++)) === "'".charCodeAt(0)) {
        //   let ch = String.fromCharCode(c);
        //   lexeme += ch;
        // }
        // curIndex--;
        return TK_VAR;
      }
      // Recognize \frac, \sqrt.
      function latex() {
        let c;
        c = src.charCodeAt(curIndex++);
        if (c === '$'.charCodeAt(0)) {
          // don't include \
          lexeme = String.fromCharCode(c);
        } else if (c === '%'.charCodeAt(0)) {
          lexeme += String.fromCharCode(c);
        } else if (indexOf([' '.charCodeAt(0),
                            ':'.charCodeAt(0),
                            ';'.charCodeAt(0),
                            ','.charCodeAt(0),
                            '!'.charCodeAt(0)], c) >= 0) {
          lexeme = "\\ ";
        } else {
          while (isAlphaCharCode(c)) {
            lexeme += String.fromCharCode(c);
            c = src.charCodeAt(curIndex++);
          }
          curIndex--;
        }
        let tk = lexemeToToken[lexeme];
        if (tk === void 0) {
          tk = TK_VAR;   // e.g. \\theta
        } else if (tk === TK_TEXT || tk === TK_TYPE) {
          c = src.charCodeAt(curIndex++);
          // Skip whitespace before '{'
          while (c && c !== "{".charCodeAt(0)) {
            c = src.charCodeAt(curIndex++);
          }
          lexeme = "";
          c = src.charCodeAt(curIndex++);
          while (c && c !== "}".charCodeAt(0)) {
            let ch = String.fromCharCode(c);
            lexeme += ch;
            c = src.charCodeAt(curIndex++);
          }
          if (tk !== TK_TYPE) {
            // Not a type, so convert to a var.
            if (!lexeme || Model.option("ignoreText")) {
              tk = null;   // treat as whitespace
            } else {
              tk = TK_VAR; // treat as variable
            }
          }
        }
        return tk;
      }
      function prime(c) {
        assert(c === 39);
        lexeme = "'";
        while (src.charCodeAt(curIndex) === 39) {
          curIndex++;
          lexeme += "'";
        }
        return TK_VAR;
      }
      // Return a scanner object.
      return {
        start: start ,
        lexeme: function () {
          if (lexeme) {
            return lexeme;
          }
        },
        pos: function() { return curIndex; }
      }
    }
  }
  return Model;
})();

