import fs from "fs";
import {execSync} from "child_process";

function rmdir(path) {
  try { var files = fs.readdirSync(path); }
  catch(e) { return; }
  if (files.length > 0) {
    for (var i = 0; i < files.length; i++) {
      var filePath = path + '/' + files[i];
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
      } else {
	rmdir(filePath);
      }
    }
  }
  fs.rmdirSync(path);
}

function mkdir(path) {
  fs.mkdirSync(path);
}

function cldir(path) {
  rmdir(path);
  mkdir(path);
}

function exec(cmd, args) {
//  console.log("exec() cmd=" + cmd);
  execSync(cmd, args);
}

function clean() {
  console.log("Cleaning...");
  cldir("./build");
  cldir("./lib");
}

function compile() {
  console.log("Compiling...");
  exec("babel src --out-dir lib");
}

function bundle() {
  console.log("Bundling...");
  exec("browserify lib/mathspeak.js > build/mathspeak.js");
}

function build() {
  let t0 = Date.now();
  clean();
  compile();
  bundle();
  console.log("Build completed in " + (Date.now() - t0) + " ms");
}

build();
