________________________________________________________________________________
Increasing the Performance of Dynamic Analyses Using Program Transformations

		Course Project proposed by Cristian-Alexandru Staicu
		Program Testing and Analysis. Winter Semester 2017/18
		Technical University of Darmstadt
________________________________________________________________________________
	@authors: Lina Jukonyte, Arseny Skryagin
	@email: {lina.jukonyte, arseny.skryagin}@stud.tu-darmstadt.de
________________________________________________________________________________

This document describes the exact procedure of the implementation. This consists
of the three files: "myprogram2_uglify3.js", "myprogram2_uglify2.js" and
"evaluation.py". All three files are developed, tested and executed on
Debian 9.1 and Ubuntu 16.04 machines.


__Content__
1) Requirements
2) Commands for an execution and warnings
3) Explanations of the outputs (The answers on the questions:
	 Where and what can be found? What contains what?



1) Requirements:

To be able to run "myprogram2_uglify3.js" and "myprogram2_uglify2.js" run the
following commands in the terminal
	npm install uglify-js2
	npm install uglify-js
Please check if the following Python3 libraries are installed on your machine:
	csv, numpy, scipy, pandas, matplotlib
If some is missing, please run the following command on the terminal first:
	pip3 install name_of_the_library_from_the_list_above
python3-tk is also used by "evaluation.py". To install it, run
	sudo apt install python3-tk



2) Commands for an execution and the warning:
To run "myprogram2_uglify3.js" for 15 times put the following command line to
the terminal on your machine and press Enter

	for i in `seq 15`; do node myprogram2_uglify3.js; done

To run "evaluation.py" put the following command line to the terminal on your
machine and press Enter

	python3 evaluation.py

WARNING: Please be aware of the fact, that "myprogram2_uglify2.js" and
"myprogram2_uglify3.js" produce the execution output using the SAME directories
structure. Because of the fact we strongly recommend to not mixing the results
of the two procedures in order to keep the "results" subdirectory "clean".
"evaluation.py" doesn't distinguish, which version of the "uglify-js" was used
to transform Octane files.

WARNING: If you are going to change the number of the jalangi2 runs over the
transformed Octane files, please be aware of that, to keep this number for
all runs of "myprogram2_uglify*.js" you are planning to do. "evaluation.py"
checks for the number of runs in for the first transformation the script will
find in "experiments/results/" and assume this number to be the same for all
subdirectories in this folder. This is important to keep the generation of CSV
files consistent. Because of this fact you will be not able to aggregate results
from different transformations with different number of Jalangi2 runs automatically
using "evaluation.py". If you have some different setups, please separate them
from "/experiments/results/" and delete "/experiments/evaluation/" first, before
running "evaluation.py"    



3) Explanations of the outputs:

	The outputs of an execution of these are filed in the following structure of
sub-folders:
  	/experiments/transformed/
		/experiments/results/
		/experiments/evaluation/
	The first two sub-folders are created by "myprogram2_uglify*.js". The
"*/transformed/" contains subdirectories with the certain set of the transformed
files. Those are transformed by either UglifyJS2 or UglifyJS3 depending on, with
which version of "myprogram2_uglify*.js" those are produced.
	The first sub-folder contains subdirectories named after the transformation
number. Each offers the transformed Octane files, "validation_options.txt" and
"compressor_options.txt". In the first are the validation of the results from
"esprime". In the second are the exact transformation options filed.
	The second sub-folder contains the subdirectories with the names as those from
"/experiments/transformed/". In these subdirectories are all measurements of the
metrics including the ten runs of octane with the transformed files and the
files sizes of the transformed files.
 	The third sub-folders is created only if "evaluation.py" is called. This sub-
folders contains for its part subdirectories named after the transformed Octane
files. Each of these subdirectories offers graphs for each measured metric, a
CSV-file of the same name and "seemingly_equivalent.txt". The CSV-file is made
of rows. Each row consists the transformation number and all measurements:
 		computation time in seconds (ct as an abbreviation)
		number of 'hooks' (hooks as -//-)
		number of 'conditionals' (conditionals as -//-)
		estimated memory usage in MB (memory_usage as -//-)
		score from octane (octane_score as -//-)
		averages of each metric,
		lower and upper bounds of confidence interval for each average.
"seemingly_equivalent.txt" contains the transformations sorted after the file
sizes. On this way it is checked, if the certain "types" of the transformations
produce the same/equivalent source code. Of course it is only the first sign of
this fact. "evaluation.py" does not check transformed files for the textual
equivalence.
