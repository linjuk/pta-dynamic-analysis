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
of the three files: "randomzed_transformations.js", "fixed_transformations.js" and
"evaluation.py". All three files are developed and tested on Debian 9.1 and Ubuntu
16.04 machines.


__Content__
1) First run and general requirements
2) Commands for an execution and warnings
3) Explanations of the outputs (The answers on the questions:
	 Where and what can be found? What contains what?
4) Old implementation



1) First run: Please open in a terminal the folder of your choise and pass 
	git clone https://github.com/linjuk/pta-dynamic-analysis.git;
	cd pta-dynamic-analysis;
Then
	npm run clean;
	npm start;
The last command will execute "randomized_transformations.js" with ten Octane
benchmark and five Jalangi2 dynamic analysis runs. 

General requirements:

After the first run you should be able to run "randomized_transformations.js"
and "fixed_transformations.js" as often as necessary. The execution of 
"randomized_transformations.js" dices every time a new set of compresser options,
which are used by minify function of "uglify-js2". I.e. the content of 
"pta-dynamic-analysis/generated/results/transformed" will be anlarged by one
subfolder by each new execution of the script.
Before running "evaluation.py" please check if the following Python3 libraries
are installed on your machine:
	csv, numpy, scipy, pandas, matplotlib
If some are/is missing, please run the following command on the terminal first:
	pip3 install name_of_the_library_from_the_list_above;
python3-tk is also used by "evaluation.py". To install it, run
	sudo apt install python3-tk;


2) Commands for an execution and the warnings:
To run "randomized_transformations.js" for 15 times put the following command 
line to the terminal on your machine and press Enter
	for i in `seq 15`; do node randomized_transformations.js; done
To run "evaluation.py" put the following command line to the terminal on your
machine and press Enter
	python3 evaluation.py

WARNING: If you are going to change the number of the jalangi2 runs over the
transformed Octane files, please be aware of that, to keep this number for
all runs of "randomized_transformations.js" and "fixed_transformations.js" 
you are planning to do. "evaluation.py" checks for the number of runs in for
the first transformation the script will find in 
"/pta-dynamic-analysis/generated/results/transformed" and assume this number
to be the same for all subdirectories in this folder. This is important to 
keep the generation of CSV files consistent. Because of this fact you will be 
not able to aggregate results from different transformations with different 
number of Jalangi2 runs automatically using "evaluation.py". If you have some 
different setups, please separate them from 
"/pta-dynamic-analysis/generated/results/transformed" and delete 
"pta-dynamic-analysis/generated/evaluation/" first, before running "evaluation.py"    


3) Explanations of the outputs:

The outputs of an execution of these three scripts are filed in the following 
structure of sub-folders:
  	/pta-dynamic-analysis/generated/
		transformed/
		results/
		source-backup/
		evaluation/
The first sub-folder cointains the transformed Octane1 and Octane2 source files
(subdivided in the subfolders of the same name). As well you will find the file
"compressor_options.txt" where the options (including the diced ones) for "minify"
function of "uglify-js2" are filed.
The second sub-folder contains "original/" and "transformed/" sub-directories.
"original/" includes "jalangi/" and "octane/". "jalangi/" hosted the run results
of the dynamic analysis (run_i, i from {1,...,5}). "octane/" has the results of 
ten runs of Octane benchmark as files octane_run_j.txt (j from {1,...,10}).
"transformed/" have all produced transformation combinations genereated during 
an execution of "randomized_transformations.js". This sub-folder have the same 
structure as "original/". 
The third sub-folder keeps the backup of Octane2 files. This is not truly mandetory
for the functioning. It is generated because of the issue that is described in 
the subsection 2.1 of the protocol.
The last sub-folder is the result of an execution of "evaluation.py". It content
is detailed descirbed in the protocol. One remark stil notable. The script 
calculates a mean, a upper and a lower bound of each measured metric. It is assumed
the meausrements to be normal distributed. There is no proof for this assumption
provided. The Octane score is the evarage of 4 to 10.
The CSV-file is made of rows. Each row consists the transformation number and 
all measurements:
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


4) Old implementation:
For the complenteness is the archive "old_implementation.zip". After an extraction
you will find the directory "old_implementation". This consist the first fully
functioning implementation approach. Because of the issue that is described in
section 2.1 of the protocol this doesn't fulfil all of the task and aims of the
project. For details regarding the execution see README.txt in the directory.
