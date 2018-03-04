// include modules
var cp = require("child_process");
var exec = require("child_process").execSync;
var fs = require("fs");
var UglifyJS = require("uglify-js2");

// let's initialize all paths here
var path = {};

path['base'] = process.cwd() + '/';
path['jalangiPath'] = path['base'] + 'jalangi2/';
path['benchmark-octane'] = path['base'] + 'benchmark-octane/'
path['octanePath'] = path['benchmark-octane'] + 'lib/octane/';
path['generatedPath'] = path['base'] + 'generated/';
path['transformedPath'] = path['generatedPath'] + 'transformed/';
path['resultsPath'] = path['generatedPath'] + 'results/';

var octaneCount = process.argv[3] || 1;
var jalangiCount = process.argv[5] || 1;

// create folders if they don't exist
for (var key in path) {

  if (!fs.existsSync(path[key])) {
    fs.mkdirSync(path[key]);
    console.log('Directory created:' + path[key]);
  }
  else {
    console.log('Directory already exists:' + path[key]);
  }

}

// function to output command results
function output(error, stdout, stderr) {
  console.log(stdout);
}

// function to dice an array of 18 random numbers.
// All of numbers are either an one or an zero.
function dice() {
  var c = [];
  for (var i = 0; i < 18; i++) {
    var tmp = Math.random();
    if (tmp < 0.5) {
      c[i] = 0;
    } else {
      c[i] = 1;
    }
  }
  return c;
}

// function to generate an digit number from diced array
// WARNING: the function returns an integer NOT a string!
function name(c) {
  var number = "";
  for (var i = 0; i < c.length; i++) {
    if (c[i] == 0) {
      number = number + "0";
    } else {
      number = number + "1";
    }
  }
  var digit = parseInt(number, 2)
  return digit;
}

// function to generate an txt file that contains compressor options
function generateOptionsFile(c, transformedPath) {
  var options = "";
  options += "mangle:true,\ncompress:{\n ";
  var dicedOptions = ["booleans ", "cascade", "conditionals", "comparisons", "dead_code", "drop_debugger", "evaluate", "hoist_funs", "hoist_vars", "if_return", "join_vars", "loops", "sequences", "side_effects", "properties", "unsafe", "unsafe_comps", "unused"];
  for (var i = 0; i <= c.length; i++) {
    if (c[i] === 0) {
      options += dicedOptions[i] + ": false,\n";
    }
    if (c[i] === 1) {
      options += dicedOptions[i] + ": true,\n";
    }
  }
  options += "\n}"
  fs.appendFileSync(transformedPath + "/compressor_options.txt", options, "utf8")
}

// function to convert a given number to a boolean
function toBoolean(num) {
  var bool = false;
  if (num > 0) {
    bool = true;
  }
  return bool;
}
// sourceCode files
var sourceFiles = [
  "box2d",
  // //'code-load' ,
  'deltablue',
  'earley-boyer',
  // //'gbemu' ,
  'navier-stokes',
  // // 'pdfjs',
  'raytrace',
  'splay'
];

// chained analysis part of the command
// var analysis = '--analysis '+path['base']+'analysis.js';
var analysis = '--analysis ' + path['jalangiPath'] + 'src/js/sample_analyses/ChainedAnalyses.js --analysis ' + path['jalangiPath'] + 'src/js/sample_analyses/dlint/Utils.js --analysis ' + path['jalangiPath'] + 'src/js/sample_analyses/dlint/CheckNaN.js --analysis ' + path['jalangiPath'] + 'src/js/sample_analyses/dlint/FunCalledWithMoreArguments.js --analysis ' + path['jalangiPath'] + 'src/js/sample_analyses/dlint/CompareFunctionWithPrimitives.js --analysis ' + path['jalangiPath'] + 'src/js/sample_analyses/dlint/ShadowProtoProperty.js --analysis ' + path['jalangiPath'] + 'src/js/sample_analyses/dlint/ConcatUndefinedToString.js --analysis ' + path['jalangiPath'] + 'src/js/sample_analyses/dlint/UndefinedOffset.js --analysis ' + path['base'] + 'analysis.js';

var startTime = 0;
var originalResultsPath = path['resultsPath'] + 'original/'

if (!fs.existsSync(originalResultsPath)) {
  fs.mkdirSync(originalResultsPath);
}

console.log('');
console.log('|-------------------------------------------|');
console.log('| Dynamic analysis on original source files |');
console.log('|-------------------------------------------|');
console.log('');
// perform analysis on source files
for (var i = 0; i < sourceFiles.length; i++) {
  startTime = process.hrtime();
  var startMem = (((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100).toFixed(2);
  cp.execSync('cp ' + path['jalangiPath'] + 'tests/octane/' + sourceFiles[i] + '.js ' + path['octanePath'] + "/" + sourceFiles[i] + '.js');
  var command = 'node ' + path['jalangiPath'] + 'src/js/commands/jalangi.js --inlineIID --inlineSource ' + analysis + ' ' + path['octanePath'] + sourceFiles[i] + '.js >> ' + originalResultsPath + sourceFiles[i] + '.js_results.txt';
  // like running the command in terminal and output function defined above prints the result of the command
  exec(command, output);
  var hookCount = cp.execSync('grep -c J$. ' + path['octanePath'] + sourceFiles[i] + '_jalangi_.js').toString();
  hookCount = hookCount.trimRight();
  var regex = /[\d|,|.|E|\+]+/g;
  var conditionalsCount = cp.execSync("grep -e conditionals " + originalResultsPath + '/' + sourceFiles[i] + ".js_results.txt").toString().match(regex)[0];
  var endMem = (((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100).toFixed(2);
  var estimatedMemUsage = (endMem - startMem).toFixed(2);
  var compTime = parseFloat(process.hrtime(startTime)[0] + "." + process.hrtime(startTime)[1].toString()).toFixed(2);
  console.log('✓ ' + sourceFiles[i] + '.js, elapsed time: ' + compTime + ', hookCount: ' + hookCount + ', conditionalsCount: ' + conditionalsCount + ' memStart: ' + startMem + 'MB memEnd: ' + endMem + 'MB estimatedMemUsage: ' + estimatedMemUsage + 'MB');
  var fileResultsFromOriginals = sourceFiles[i] + ".min.js: " + compTime + "," + hookCount + "," + conditionalsCount + "," + estimatedMemUsage;
  fs.appendFileSync(originalResultsPath + "originals_results.txt", fileResultsFromOriginals + "\n", "utf8");
}

// process.exit();

// path to the bencmark source folder and the run script
// var benchmarkPath = process.cwd() + "/benchmark-octane/lib/octane/";
// var octaneRunPath = process.cwd() + "/benchmark-octane/run.js";
// var pathToOctaneRunsOnOriginals = originalResultsPath + "octane";

var originalOctaneBenchmarkPath = originalResultsPath + 'octane/'

if (!fs.existsSync(originalOctaneBenchmarkPath)) {
  fs.mkdirSync(originalOctaneBenchmarkPath);
}

console.log('');
console.log('|-------------------------------------------------------------------------|');
console.log('| Run octane benchmark on original non-transformed files and save results |');
console.log('|-------------------------------------------------------------------------|');
console.log('');

// copy relevant files from benchmark-octane nodejs library to our generated/results/octane folder
// for(var i = 0; i < sourceFiles.length; i++)
// {
//   cp.execSync('cp ' + path['octanePath'] + "/" + sourceFiles[i] + '.js ' + originalOctaneBenchmarkPath + "/" + sourceFiles[i] + '.js' );
// }

// execute the Octane benchmark n number of times and write the run results
// todo = parameterize number of octane benchmark
for (var j = 1; j <= octaneCount; j++) {
  var computed_command = 'node ' + path['benchmark-octane'] + 'run.js >> ' + originalOctaneBenchmarkPath + 'octane_run_' + j + '.txt';
  cp.execSync(computed_command);
  console.log('✓ Octane benchmark run ' + j + ' time');
}

console.log('');
console.log('|---------------------|');
console.log('| Code Transformation |');
console.log('|---------------------|');
console.log('');

// dice the 18 options
var c = dice();
// convert the fifteen-digit binary number into the decimal number.
// This number will server as the name for subfolders in "/experiments/transformed"
// and "/experiments/results"
var digit = name(c);
console.log('');
console.log('Number of the generated transformation: ' + digit.toString());

var transformationPath = path['transformedPath'] + digit.toString() + "/";

// check if diced combination of options already exists.
// If so, dice so long until "new" set of options is in place.
while (fs.existsSync(transformationPath)) {
  c = dice;
  digit = name(c);
  transformationPath = path['transformedPath'] + digit.toString() + "/";
}
// create the new subfolder for the transformation
fs.mkdirSync(transformationPath);
// write a file with generated compressor options for new set of options
generateOptionsFile(c, transformationPath)
// transform source file with the generated options
for (var i = 0; i < sourceFiles.length; i++) {
  startTime = process.hrtime();
  var sourceFilePath = path['octanePath'] + sourceFiles[i] + ".js";
  var destFilePath = transformationPath + sourceFiles[i] + ".min.js";

  // refer to this link for further transformation options:
  // https://www.npmjs.com/package/uglify-js#compress-options
  var result = UglifyJS.minify(sourceFilePath, {
    mangle: false,
    compress: {
      booleans: toBoolean(c[0]),
      cascade: toBoolean(c[1]),
      conditionals: toBoolean(c[2]),
      comparisons: toBoolean(c[3]),
      dead_code: toBoolean(c[4]),
      drop_debugger: toBoolean(c[5]),
      evaluate: toBoolean(c[6]),
      hoist_funs: toBoolean(c[7]),
      hoist_vars: toBoolean(c[8]),
      if_return: toBoolean(c[9]),
      join_vars: toBoolean(c[10]),
      loops: toBoolean(c[11]),
      properties: toBoolean(c[12]),
      sequences: toBoolean(c[13]),
      side_effects: toBoolean(c[14]),
      unsafe: toBoolean(c[15]),
      unsafe_comps: toBoolean(c[16]),
      unused: toBoolean(c[17]),
      warnings: true,
      passes: 3,
    }
  });
  var compTime = parseFloat(process.hrtime(startTime)[0] + "." + process.hrtime(startTime)[1].toString()).toFixed(2);
  fs.writeFileSync(destFilePath, result.code);
  console.log('✓ ' + sourceFiles[i] + '.js, elapsed time is ' + compTime);
}

console.log('');
console.log('|-------------------------------------------------------|');
console.log('| Validating the functionality of the transformed files |');
console.log('|-------------------------------------------------------|');
console.log('');
// perform validation of the transformed files
for (var i = 0; i < sourceFiles.length; i++) {
  var command = 'esvalidate ' + destFilePath
  exec(command, output);
  var message = '✓ ' + sourceFiles[i] + '.min.js is validated as runnable';
  fs.appendFileSync(transformationPath + "/validation_options.txt", message + "\n", "utf8")
  console.log(message);
}

console.log('');
console.log('|--------------------------------------------------|');
console.log('| Pass the transformed files to Octane (benchmark) |');
console.log('| Run it to obtain the measured score              |');
console.log('|--------------------------------------------------|');
console.log('');
// create the result subfolder with the same name as the folder for the transformation
fs.mkdirSync(path['resultsPath'] + digit.toString());
var resultsPath = path['resultsPath'] + digit.toString() + "/";
// create the Octane result folder
var octaneResultsPath = resultsPath + "octane";
fs.mkdirSync(octaneResultsPath)

// copy all transfomed files to the bencmark
for (var i = 0; i < sourceFiles.length; i++) {
  cp.execSync('cp ' + transformationPath + "/" + sourceFiles[i] + '.min.js ' + path['octanePath'] + "/" + sourceFiles[i] + '.js');
}
// execute the Octane benchmark 10 times and write the run results
for (var j = 1; j <= octaneCount; j++) {
  cp.execSync('node ' + path['benchmark-octane'] + 'run.js >> ' + octaneResultsPath + '/octane_run_' + j + '.txt');
  console.log('✓ Octane benchmark run ' + j + ' time');

  if (j == 1) {
    var command_run_octane = 'node ' + path['benchmark-octane'] + 'run.js >> ' + resultsPath + 'octane_results.txt';
    exec(command_run_octane, output);

  }
}


console.log('');
console.log('|---------------------------------------|');
console.log('| Dynamic analysis on transformed files |');
console.log('|---------------------------------------|');
console.log('');
for (var i = 0; i < sourceFiles.length; i++) {
  var regex = /[\d|,|.|E|K|M\+]+/g;
  var sizeOfFile = cp.execSync('du -h ' + transformationPath + sourceFiles[i] + '.min.js').toString().match(regex)[0];
  fs.appendFileSync(resultsPath + "files_sizes.txt", sourceFiles[i] + ".min.js: " + sizeOfFile + ",\n", "utf8");
}
// perform analysis on transformed files for ten times and aggrigate the data
for (var j = 1; j <= jalangiCount; j++) {
  console.log('');
  console.log('|-----------------------------------|');
  console.log('| The number of the current run: ' + j + '  |');
  console.log('|-----------------------------------|');
  console.log('');
  fs.mkdirSync(resultsPath + "run_" + j)
  var runPath = resultsPath + "run_" + j + "/"
  for (var i = 0; i < sourceFiles.length; i++) {
    startTime = process.hrtime();
    var startMem = (((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100).toFixed(2);
    var command = 'node ' + path['jalangiPath'] + '/src/js/commands/jalangi.js --inlineIID --inlineSource ' + analysis + " " + transformationPath + "/" + sourceFiles[i] + '.min.js >> ' + runPath + sourceFiles[i] + '.min.js_results.txt';
    // like running the command in terminal and output function defined above prints the result of the command
    exec(command, output);
    var hookCount = cp.execSync('grep -c J$. ' + transformationPath + "/" + sourceFiles[i] + '.min_jalangi_.js').toString();
    hookCount = hookCount.trimRight();
    var regex = /[\d|,|.|E|\+]+/g;
    var conditionalsCount = cp.execSync("grep -e conditionals " + runPath + sourceFiles[i] + ".min.js_results.txt").toString().match(regex)[0];
    var endMem = (((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100).toFixed(2);
    var estimatedMemUsage = (endMem - startMem).toFixed(2);
    var compTime = parseFloat(process.hrtime(startTime)[0] + "." + process.hrtime(startTime)[1].toString()).toFixed(2);
    console.log('✓ ' + sourceFiles[i] + '.min.js, elapsed time: ' + compTime + ', hookCount: ' + hookCount + ', conditionalsCount: ' + conditionalsCount + ', memStart: ' + startMem + 'MB memEnd: ' + endMem + 'MB estimatedMemUsage: ' + estimatedMemUsage + 'MB');
    var fileResults = sourceFiles[i] + ".min.js: " + compTime + "," + hookCount + "," + conditionalsCount + "," + estimatedMemUsage;
    fs.appendFileSync(runPath + "run_results.txt", fileResults + "\n", "utf8");
  }
}
