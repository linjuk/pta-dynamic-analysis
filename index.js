// include modules
var cp = require("child_process");
var exec = require("child_process").execSync;
var fs = require("fs");
var UglifyJS = require("uglify-js2");

// fetch arguments passed to our program in command line. For example node index.js --octane 10 --jalangi 10. 
// Code below will fetch octane and jalangi values, if there are no values provided, it will default to 1

var path = {};
var startTime = 0;
var octaneCount = fetchArgument('octane') || 10;
var jalangiCount = fetchArgument('jalangi') || 5;
var transformation = fetchArgument('transformation') || 'fixed';
var masterRandom = '';

// sourceCode files
var sourceFiles = [
  'crypto', //
  'deltablue',
  'earley-boyer',
  'raytrace',
  'richards', //
];

// let's initialize all paths here
initializePaths();

// chained analysis part of the command
var analysis = ' --analysis ' + path['base'] + 'analysis.js';
//var analysis = '--analysis ' + path['jalangi'] + 'src/js/sample_analyses/ChainedAnalyses.js --analysis ' + path['jalangi'] + 'src/js/sample_analyses/dlint/Utils.js --analysis ' + path['jalangi'] + 'src/js/sample_analyses/dlint/CheckNaN.js --analysis ' + path['jalangi'] + 'src/js/sample_analyses/dlint/FunCalledWithMoreArguments.js --analysis ' + path['jalangi'] + 'src/js/sample_analyses/dlint/CompareFunctionWithPrimitives.js --analysis ' + path['jalangi'] + 'src/js/sample_analyses/dlint/ShadowProtoProperty.js --analysis ' + path['jalangi'] + 'src/js/sample_analyses/dlint/ConcatUndefinedToString.js --analysis ' + path['jalangi'] + 'src/js/sample_analyses/dlint/UndefinedOffset.js --analysis ' + path['base'] + 'analysis.js';

// remove results 
clearPreviousResults();

// create folders if they don't exist
generateFolders();

//backup of original source files, both octane1 and octane2
backupSourceFiles();

// perform analysis on non transformed source files
header('Run Jalangi dynamic analysis on original non-transformed source files and save results');
runJalangiOnSource();

// run octane on non transformed source files
header('Run Octane benchmark on original non-transformed files and save results');
runOctaneOnSource();

header('Run code transformations on original non-transformed files');
calculateFileSize(1); // 1 = source files
runTransformations();
calculateFileSize(2); // 2 = transformed files

header('Validating the functionality of the transformed files');
validateTransformedFiles();

header('Run Octane benchmark on transformed files and save results');
runOctaneOnTransformed();

header('Run Jalangi dynamic analysis on transformed files');
runJalangiOnTransformed();

// incase of random transformation, copy results to history
copyResultsToHistory()

/* functions definitions */

/**
 * @function 
 * prints standard output to screen
 */
function output(error, stdout, stderr) {
  console.log(stdout);
}

/**
 * @function 
 * function to dice an array of 18 random numbers, all of numbers are either an one or an zero.
 */
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

/**
 * @function 
 * function to generate an digit number from diced array WARNING: the function returns an integer NOT a string!
 */
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

  if (transformation === 'fixed') {
    var options = `
      mangle:true,\n
      compress:{\n
        booleans: true,\n
        cascade: false,\n
        conditionals: true,\n
        comparisons: false,\n
        dead_code: false,\n
        drop_debugger: false,\n
        evaluate: false,\n
        hoist_funs: false,\n
        hoist_vars: false,\n
        if_return: false,\n
        join_vars: false,\n
        loops: false,\n
        properties: false,\n
        sequences: false,\n
        side_effects: false,\n
        unsafe: false,\n
        unsafe_comps: false,\n
        unused: false,\n
        warnings: false,\n
        passes: 3\n
    }`;
  }
  if (transformation === 'random') {
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
  }

  fs.appendFileSync(transformedPath + "/compressor_options.txt", options, "utf8")
}

/**
 * @function 
 * function to convert a given number to a boolean
 */
function toBoolean(num) {
  var bool = false;
  if (num > 0) {
    bool = true;
  }
  return bool;
}

/**
 * @function 
 * runs jalangi on source files n number of times
 */
function runJalangiOnSource() {

  //for (var j = 1; j <= jalangiCount; j++) {

    //create folder for each run
    runPath = path['resultsOriginalJalangi'];
    if (!fs.existsSync(runPath)) {
      fs.mkdirSync(runPath);
    }

    //console.log('Run ' + j);
    //console.log('');


    for (var i = 0; i < sourceFiles.length; i++) {
      startTime = process.hrtime();
      var startMem = (((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100).toFixed(2);
      cp.execSync('cp ' + path['jalangi'] + 'tests/octane/' + sourceFiles[i] + '.js ' + path['octane'] + "/" + sourceFiles[i] + '.js');
      if (fs.existsSync(runPath + sourceFiles[i] + '.js_results.txt'))
        fs.unlinkSync(runPath + sourceFiles[i] + '.js_results.txt');

      var command = 'node ' + path['jalangi'] + 'src/js/commands/jalangi.js --inlineIID --inlineSource ' + analysis + ' ' + path['octane'] + sourceFiles[i] + '.js >> ' + runPath + sourceFiles[i] + '.js_results.txt';
      // like running the command in terminal and output function defined above prints the result of the command
      try {
        exec(command, output);
      }
      catch (err) {
        //console.log('caugth');
        //console.log(err.name, err.message);
      }


      var hookCount = cp.execSync('grep -c J$. ' + path['octane'] + sourceFiles[i] + '_jalangi_.js').toString();
      hookCount = hookCount.trimRight();

      var regex = /[\d|,|.|E|\+]+/g;
      var conditionalsCount = cp.execSync("grep -e conditionals " + runPath + sourceFiles[i] + ".js_results.txt").toString().match(regex)[0];

      var endMem = (((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100).toFixed(2);
      var estimatedMemUsage = (endMem - startMem).toFixed(2);
      var compTime = parseFloat(process.hrtime(startTime)[0] + "." + process.hrtime(startTime)[1].toString()).toFixed(2);

      var fileResultsFromOriginals = sourceFiles[i] + ".js: " + compTime + "," + hookCount + "," + conditionalsCount + "," + estimatedMemUsage;
      var consoleStats = '✓ ' + sourceFiles[i] + '.js, elapsed time: ' + compTime + ', hookCount: ' + hookCount + ', conditionalsCount: ' + conditionalsCount + ' memStart: ' + startMem + 'MB memEnd: ' + endMem + 'MB estimatedMemUsage: ' + estimatedMemUsage + 'MB';
      fs.appendFileSync(runPath + 'originals_results.txt', fileResultsFromOriginals + "\n", "utf8");
      console.log(consoleStats);
    }

    console.log('');
  //}
}

/**
 * @function 
 * runs jalangi on transformed files n number of times
 */
function runJalangiOnTransformed() {
  // perform analysis on transformed files for ten times and aggrigate the data



  for (var j = 1; j <= jalangiCount; j++) {

    //create folder for each run resultsTransformedJalangi
    runPath = path['resultsTransformedJalangi'] + 'run_' + j + '/';
    if (!fs.existsSync(runPath)) {
      fs.mkdirSync(runPath);
    }

    console.log('Run ' + j);
    console.log('');

    for (var i = 0; i < sourceFiles.length; i++) {
      startTime = process.hrtime();
      var startMem = (((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100).toFixed(2);
      if (fs.existsSync(runPath + sourceFiles[i] + '.min.js_results.txt'))
        fs.unlinkSync(runPath + sourceFiles[i] + '.min.js_results.txt');

      var command = 'node ' + path['jalangi'] + 'src/js/commands/jalangi.js --inlineIID --inlineSource ' + analysis + ' ' + path['transformedOctane1'] + sourceFiles[i] + '.min.js >> ' + runPath + sourceFiles[i] + '.min.js_results.txt';
      // like running the command in terminal and output function defined above prints the result of the command
      exec(command, output);

      var hookCount = cp.execSync('grep -c J$. ' + path['transformedOctane1'] + sourceFiles[i] + '.min_jalangi_.js').toString();
      hookCount = hookCount.trimRight();

      var regex = /[\d|,|.|E|\+]+/g;
      var conditionalsCount = cp.execSync("grep -e conditionals " + runPath + sourceFiles[i] + ".min.js_results.txt").toString().match(regex)[0];

      var endMem = (((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100).toFixed(2);
      var estimatedMemUsage = (endMem - startMem).toFixed(2);
      var compTime = parseFloat(process.hrtime(startTime)[0] + "." + process.hrtime(startTime)[1].toString()).toFixed(2);

      var fileResultsFromOriginals = sourceFiles[i] + ".min.js: " + compTime + "," + hookCount + "," + conditionalsCount + "," + estimatedMemUsage;
      var consoleStats = '✓ ' + sourceFiles[i] + '.min.js, elapsed time: ' + compTime + ', hookCount: ' + hookCount + ', conditionalsCount: ' + conditionalsCount + ' memStart: ' + startMem + 'MB memEnd: ' + endMem + 'MB estimatedMemUsage: ' + estimatedMemUsage + 'MB';
      //fs.appendFileSync(runPath + sourceFiles[i] + '.min.js_results.txt', consoleStats + "\n", "utf8");
      fs.appendFileSync(runPath + 'run_results.txt', fileResultsFromOriginals + "\n", "utf8");
      console.log(consoleStats);
    }

    console.log('');

  }

}

/**
 * @function 
 * runs octane on source files n number of times
 */
function runOctaneOnSource() {
  // since octane1 files copied to octane2 folder does not contain BenchmarkSuite, we have
  // identified some octane files that are similar between the version except the BenchmarkSuite code
  // we'll be using those to calculate octane score to make octane benchmark runnable

  // copy backup octane2 files to octane folder as these contain BenchmarkSuite code
  for (var i = 0; i < sourceFiles.length; i++) {
    cp.execSync('cp ' + path['generated'] + 'source-backup/octane2/' + sourceFiles[i] + '.js ' + path['octane'] + sourceFiles[i] + '.js ');
  }

  //exec('rm ' + path['resultsOriginalOctane'] + '*');

  for (var j = 1; j <= octaneCount; j++) {
    var computed_command = 'node ' + path['benchmark-octane'] + 'run.js >> ' + path['resultsOriginalOctane'] + 'octane_run_' + j + '.txt';
    cp.execSync(computed_command);
    console.log('✓ Octane benchmark run ' + j + ' time on all original files');
  }
}

/**
 * @function 
 * runs octane on source files n number of times
 */
function runOctaneOnTransformed() {
  // copy all transfomed files to the bencmark
  for (var i = 0; i < sourceFiles.length; i++) {
    //overwrite the transformed file in benchmark-octane octane folder
    cp.execSync('cp ' + path['transformedOctane2'] + sourceFiles[i] + '.min.js ' + path['octane'] + "/" + sourceFiles[i] + '.js');
  }

  //exec('rm ' + path['resultsOriginalOctane'] + '*');

  // execute the Octane benchmark n times and write the run results
  for (var j = 1; j <= octaneCount; j++) {
    cp.execSync('node ' + path['benchmark-octane'] + 'run.js >> ' + path['resultsTransformedOctane'] + '/octane_run_' + j + '.txt');
    console.log('✓ Octane benchmark run ' + j + ' time on transformed files');
  }
}

/**
 * @function 
 * delete generated folder
 */
function clearPreviousResults() {
  if (fs.existsSync(path['generated'])) {
    exec('rm -rf ' + path['generated']);
    console.log('Results cleared from last run');
  }
}

/**
 * @function 
 * generate relevant folders in one go
 */
function generateFolders() {
  for (var key in path) {

    if (!fs.existsSync(path[key])) {
      fs.mkdirSync(path[key]);
      console.log('Directory created:' + path[key]);
    }
    else {
      console.log('Directory already exists:' + path[key]);
    }
  }
}

/**
 * @function 
 * backup octane2 source files as they get overwitten throughout the program
 */
function backupSourceFiles() {
  if (!fs.existsSync(path['generated'] + 'source-backup') && !fs.existsSync(path['generated'] + 'source-backup/octane2')) {
    fs.mkdirSync(path['generated'] + 'source-backup');
    fs.mkdirSync(path['generated'] + 'source-backup/octane2');

    for (var i = 0; i < sourceFiles.length; i++) {
      cp.execSync('cp ' + path['octane'] + sourceFiles[i] + '.js ' + path['generated'] + 'source-backup/octane2/' + sourceFiles[i] + '.js');
    }
  }
  else {

    for (var i = 0; i < sourceFiles.length; i++) {
      cp.execSync('cp ' + path['generated'] + 'source-backup/octane2/' + sourceFiles[i] + '.js ' + path['octane'] + sourceFiles[i] + '.js ');
    }

  }
}

/**
 * @function 
 * initalize all paths so that paths can be referenced in a sane way through out the program
 */
function initializePaths() {
  path['base'] = process.cwd() + '/';
  path['jalangi'] = path['base'] + 'jalangi2/';
  path['history'] = path['base'] + 'history/';
  path['benchmark-octane'] = path['base'] + 'benchmark-octane/';
  path['octane'] = path['benchmark-octane'] + 'lib/octane/';
  path['generated'] = path['base'] + 'generated/';
  path['transformed'] = path['generated'] + 'transformed/';
  path['transformedOctane1'] = path['transformed'] + 'octane1/';
  path['transformedOctane2'] = path['transformed'] + 'octane2/';
  path['results'] = path['generated'] + 'results/';
  path['resultsOriginal'] = path['results'] + 'original/';
  path['resultsOriginalOctane'] = path['resultsOriginal'] + 'octane/';
  path['resultsOriginalJalangi'] = path['resultsOriginal'] + 'jalangi/';
  path['resultsTransformed'] = path['results'] + 'transformed/';
  path['resultsTransformedOctane'] = path['resultsTransformed'] + 'octane/';
  path['resultsTransformedJalangi'] = path['resultsTransformed'] + 'jalangi/';
}

/**
 * @function 
 * print message in a ascii flag to address laziness of typing console.log again and again
 */
function header(message) {

  var line = '-';
  for (var i = 0; i <= message.length; i++) {
    line += '-';
  }

  console.log('');
  console.log('|' + line + '|');
  console.log('| ' + message + ' |');
  console.log('|' + line + '|');
  console.log('');
}

/**
 * @function 
 * runs transformations on octane1 and 2 source files, use 1 for jalangi and 2 for octane benchmark, as they are the same except benchmark suite code
 */
function runTransformations() {

  //generateOptionsFile();
  // dice the 18 options
  var c = dice();
  // convert the fifteen-digit binary number into the decimal number.
  // This number will server as the name for subfolders in "/experiments/transformed"
  // and "/experiments/results"
  var digit = name(c);

  if (transformation === 'random') {

    var runPath = path['base'] + 'history/' + digit.toString();
    while (fs.existsSync(runPath)) {
      c = dice;
      digit = name(c);
      runPath = path['base'] + '/history/' + digit.toString();
    }
    // create the new subfolder for the transformation
    fs.mkdirSync(runPath);
    runPath += '/';
    masterRandom = runPath;
    generateOptionsFile(c, runPath);

  }


  // write a file with generated compressor options for new set of options
  generateOptionsFile(c, path['transformed'])

  console.log('For Octane 1 source files');
  // OCTANE 1 !!!
  // transform source file with the generated options for octane 1
  for (var i = 0; i < sourceFiles.length; i++) {

    startTime = process.hrtime();
    var sourceFilePath = path['jalangi'] + 'tests/octane/' + sourceFiles[i] + ".js";
    var destFilePath = path['transformedOctane1'] + sourceFiles[i] + ".min.js";

    // refer to this link for further transformation options:
    // https://www.npmjs.com/package/uglify-js#compress-options
    var result = '';
    if (transformation === 'fixed') {
      result = UglifyJS.minify(sourceFilePath, {
        mangle: true,
        compress: {
          booleans: true,
          cascade: false,
          conditionals: true,
          comparisons: false,
          dead_code: false,
          drop_debugger: false,
          evaluate: false,
          hoist_funs: false,
          hoist_vars: false,
          if_return: false,
          join_vars: false,
          loops: false,
          properties: false,
          sequences: false,
          side_effects: false,
          unsafe: false,
          unsafe_comps: false,
          unused: false,
          warnings: false,
          passes: 3
        }
      });
    }

    if (transformation === 'random') {
      result = UglifyJS.minify(sourceFilePath, {
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
    }


    var compTime = parseFloat(process.hrtime(startTime)[0] + "." + process.hrtime(startTime)[1].toString()).toFixed(2);
    fs.writeFileSync(destFilePath, result.code);
    console.log('✓ ' + sourceFiles[i] + '.min.js, elapsed time is ' + compTime);

    if (transformation === 'random') {

      // if (!fs.existsSync(runPath + 'octane1/')) {
      //   fs.mkdirSync(runPath + 'octane1/');
      // }
      // exec('cp ' + destFilePath + ' ' + runPath + 'octane1/');
    }
  }

  // OCTANE 2 !!!
  // transform source file with the generated options for octane 1
  console.log('For Octane 2 source files');
  for (var i = 0; i < sourceFiles.length; i++) {

    startTime = process.hrtime();
    var sourceFilePath = path['generated'] + 'source-backup/octane2/' + sourceFiles[i] + ".js";
    var destFilePath = path['transformedOctane2'] + sourceFiles[i] + ".min.js";

    // refer to this link for further transformation options:
    // https://www.npmjs.com/package/uglify-js#compress-options

    var result = '';
    if (transformation === 'fixed') {
      result = UglifyJS.minify(sourceFilePath, {
        mangle: true,
        compress: {
          booleans: true,
          cascade: false,
          conditionals: true,
          comparisons: false,
          dead_code: false,
          drop_debugger: false,
          evaluate: false,
          hoist_funs: false,
          hoist_vars: false,
          if_return: false,
          join_vars: false,
          loops: false,
          properties: false,
          sequences: false,
          side_effects: false,
          unsafe: false,
          unsafe_comps: false,
          unused: false,
          warnings: false,
          passes: 3
        }
      });
    }

    if (transformation === 'random') {
      result = UglifyJS.minify(sourceFilePath, {
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
    }

    var compTime = parseFloat(process.hrtime(startTime)[0] + "." + process.hrtime(startTime)[1].toString()).toFixed(2);
    fs.writeFileSync(destFilePath, result.code);
    console.log('✓ ' + sourceFiles[i] + '.min.js, elapsed time is ' + compTime);

    if (transformation === 'random') {

      // if (!fs.existsSync(runPath + 'octane2/')) {
      //   fs.mkdirSync(runPath + 'octane2/');
      // }

      // exec('cp ' + destFilePath + ' ' + runPath + 'octane2/');
    }
  }
}

/**
 * @function 
 * validate transformed files, both octane1 and 2 source
 */
function validateTransformedFiles() {
  // perform validation of the transformed files octane1
  console.log('Validating transformed source files from Octane1');
  destFilePath = path['transformedOctane1'];
  for (var i = 0; i < sourceFiles.length; i++) {
    var command = 'esvalidate ' + destFilePath + sourceFiles[i] + '.min.js';
    exec(command, output);
    var message = '✓ ' + sourceFiles[i] + '.min.js is validated as runnable';
    fs.appendFileSync(path['transformedOctane1'] + "/validation_options.txt", message + "\n", "utf8")
    console.log(message);
  }

  // perform validation of the transformed files octane2
  console.log('');
  console.log('Validating transformed source files from Octane2');
  destFilePath = path['transformedOctane2'];
  for (var i = 0; i < sourceFiles.length; i++) {
    var command = 'esvalidate ' + destFilePath + sourceFiles[i] + '.min.js';
    exec(command, output);
    var message = '✓ ' + sourceFiles[i] + '.min.js is validated as runnable';
    fs.appendFileSync(path['transformedOctane2'] + "/validation_options.txt", message + "\n", "utf8")
    console.log(message);
  }
}

function calculateFileSize(option) {

  // du -b doesn't work on mac, so try -h switch, however it gives values in KB instead of bytes

  // size of source
  if (option === 1) {
    for (var i = 0; i < sourceFiles.length; i++) {
      var regex = /[\d|,|.|E|K|M\+]+/g;
      var sizeOfFile = cp.execSync('du -b ' + path['jalangi'] + 'tests/octane/' + sourceFiles[i] + '.js').toString().match(regex)[0];
      fs.appendFileSync(path['resultsOriginalJalangi'] + "files_sizes.txt", sourceFiles[i] + ".min.js: " + sizeOfFile + ",\n", "utf8");
    }
  }

  // size of transformed
  if (option === 2) {
    for (var i = 0; i < sourceFiles.length; i++) {
      var regex = /[\d|,|.|E|K|M\+]+/g;
      var sizeOfFile = cp.execSync('du -b ' + path['transformedOctane1'] + sourceFiles[i] + '.min.js').toString().match(regex)[0];
      fs.appendFileSync(path['resultsTransformedJalangi'] + "files_sizes.txt", sourceFiles[i] + ".min.js: " + sizeOfFile + ",\n", "utf8");
    }
  }

}

function fetchArgument(flag) {
  for (var i = 0; i < process.argv.length; i++) {
    if (process.argv[i] == '--' + flag)
      return process.argv[i + 1]

  }
  return false;
}

function copyResultsToHistory() {


  // run only in case of random transformed
  if (transformation === 'random') {

    // for example check if 343435/results/ exists, if not, created it
    if (!fs.existsSync(masterRandom + 'results/'))
      fs.mkdirSync(masterRandom + 'results/');

     // delete 343435/results/jalangi folder
     exec('rm -rf ' + path['history'] + 'original/');

      
    // copy stuff from generated/results/transformed folder to 343435/results/
    exec('cp -a ' + path['results'] + 'transformed/. ' + masterRandom + 'results/');

    // copy stuff from generated/results/original folder to history/
    exec('cp -a ' + path['results'] + 'original/ ' + path['history']+'original');

    // take out stuff from history/original/jalangi and paste it in history/original
    exec('cp -a ' + path['history'] + 'original/jalangi/. ' + path['history'] + 'original/');

    // delete history/original/jalangi
    exec('rm -rf ' + path['history'] + 'original/jalangi');
    
    // copy stuff from 343435/results/jalangi to 343435/results
    exec('cp -a ' + masterRandom + 'results/jalangi/. ' + masterRandom + 'results/');

    // delete 343435/results/jalangi folder
    exec('rm -rf ' + masterRandom + 'results/jalangi/');

    
  }
}