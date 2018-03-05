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



1) First run: Please open in a terminal the folder of your choise and pass 
	git clone https://github.com/linjuk/pta-dynamic-analysis.git;
	cd pta-dynamic-analysis;
Then
	npm run clean;
	node index --transformation random;
The last command will execute "index.js" with ten Octane benchmark and five
Jalangi2 dynamic analysis runs. 

General requirements:

After the first run you should be able to run "randomized_transformations.js"
as often as necessary. The execution of "index.js --transformation random" dices
every time a new set of compresser options, which are used by minify function of
"uglify-js2". I.e. the content of "pta-dynamic-analysis/generated/results/transformed"
will be enlarged by one subfolder by each new execution of the script.
Before running "evaluation.py" please check if the following Python3 libraries
are installed on your machine:
	csv, numpy, scipy, pandas, matplotlib
If some are/is missing, please run the following command on the terminal first:
	pip3 install name_of_the_library_from_the_list_above;
python3-tk is also used by "evaluation.py". To install it, run
	sudo apt install python3-tk;


2) Commands for an execution and the warnings:
To run "node index.js --transformation random" for 15 times put the following 
command line to the terminal on your machine and press Enter
	for i in `seq 15`; do node index.js --transformation random; done
To run "evaluation.py" put the following command line to the terminal on your
machine and press Enter
	python3 evaluation.py
	
WARNING: "evaluation.py" assumes that the Octane benchmark was executed for 
each transformation and non-transformed original files for ten times. If you
going to adjust this number, then the number should be not less then five.
This was adopted due to the statement of the Octane benchmark depelover team.
For the possible adjustement: please change in lines 61 and 178 "range(4,7)"
to "range(4,number_you_prefer)".

WARNING: If you are going to change the number of the jalangi2 runs over the
transformed Octane files, please be aware of that, to keep this number for
all runs of "randomized_transformations.js" and "fixed_transformations.js" 
you are planning to do. "evaluation.py" checks for the number of runs in for
the first transformation the script will find in 
"pta-dynamic-analysis/history/" and assume this number
to be the same for all subdirectories in this folder. This is important to 
keep the generation of CSV files consistent. Because of this fact you will be 
not able to aggregate results from different transformations with different 
number of Jalangi2 runs automatically using "evaluation.py". If you have some 
different setups, please separate them from 
"pta-dynamic-analysis/history" and delete "pta-dynamic-analysis/evaluation/"
first, before running "evaluation.py".    


3) Explanations of the outputs:

The outputs of an execution of these three scripts are filed in the following 
structure of sub-folders:
  	/pta-dynamic-analysis/generated/
		results/
		transformed/		
		source-backup/
	/pta-dynamic-analysis/history
	/pta-dynamic-analysis/evaluation/
In "results/" you will find the results of the last execution of "index.js" 
including Octane benchmark and Jalangi dynamic analysis, both on original and
transformed files.
In "transformed/" are the transformed files of Octane1 and Octane2 saved, as 
well is "compressor_options.txt". The file contains the diced (or fixed, depending
on the execution options of "index.js") options for "minify" function of 
"uglify-js2" are filed.
In "source-backup" are backups of the original non-transformed flies of Octane1
and Octane2 saved.
The second sub-folder serves as the storage for results for each execution of 
"index.js" regardles the execution options. It contains "original/" and 
"diced_number/" sub-directories.
"original/" includes "octane/" and hostes the run result of the dynamic analysis.
"octane/" has the results of ten runs of Octane benchmark as files octane_run_j.txt
(j from {1,...,10}).
"diced_number/" have all produced transformation combinations genereated during 
an execution of "index.js". This sub-folder contain allways "results/" and
"compressor_options.txt". 
The last sub-folder is the result of an execution of "evaluation.py". Its content
is detailed descirbed in the protocol. One remark stil notable. The script 
calculates a mean, a upper and a lower bound of each measured metric. It is assumed
the meausrements to be normal distributed. There is no proof for this assumption
provided. The Octane score is the evarage of 4ths to 10s runs.
The CSV-file is made of rows. Each row consists the transformation number and 
all measurements:
 		computation time in seconds (ct as an abbreviation)
		number of 'hooks' (hooks as -//-)
		number of 'conditionals' (conditionals as -//-)
		estimated memory usage in MB (memory_usage as -//-)
		score from octane (octane_score as -//-)
		averages of each metric,
		lower and upper bounds of confidence interval for each average.
"seemingly_equivalent.txt" contains the transformations numbers sorted after the
file sizes. On this way it is checked, if the certain "types" of the transformations
produce the same/equivalent source code. Of course it is only the first sign of
this fact. "evaluation.py" does not check transformed files for the textual
equivalence.
