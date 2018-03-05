import csv, os.path, os, re, numpy as np, scipy as sp, scipy.stats, subprocess;
import pandas as pd, matplotlib.pyplot as plt;
from pathlib import Path;
# suppresses the showing of the plots
plt.ioff();

# The following function find the transformations number,
#	1. which metrics values are the smallest (vectorial)
#	2. which have the highest Octane score
def finding_min_max(file_names):
	metrics1 = ['transformation_number','ct_avg', 'hooks_avg', 'conditionals_avg', 'est_mem_usage_avg'];
	metrics2 = ['ct_avg', 'hooks_avg', 'conditionals_avg', 'est_mem_usage_avg'];
	metrics3 = ['transformation_number','octane_score'];
	for file in file_names:
		csv_file_path = evaluation_path + file + "/" + file + ".csv";
		df = pd.read_csv(csv_file_path);
		measurements = df[metrics1];
		best_trans_number = measurements.nsmallest(1, metrics2)["transformation_number"].values.tolist()[0];
		print("For " + file + " is the best transformation " + str(best_trans_number) + " occording the metrics measurements.");
		best_score = df[metrics3].nlargest(1,'octane_score')["transformation_number"].values.tolist()[0];
		print(file + " has the transformation " + str(best_score) + " with the highest Octane score.\n");

# The follwing function calculates and returns the mean value and the confidence
# interval for the given data set.
def mean_confidence_interval(data, confidence):
    a = 1.0*np.array(data);
    n = len(a);
    m, se = np.mean(a), scipy.stats.sem(a);
    h = se * sp.stats.t._ppf((1+confidence)/2., n-1);
    return m, m-h, m+h;

# The following function produces plots for each Octanae-file and each metric.
# The plots are saved in the folder "experiments/evaluation/octane_file_name/"
def plots(files_names):
	metrics = [["octane_score"],["ct_avg","ct_avg_confint_lower","ct_avg_confint_upper"],
	           ["hooks_avg","hooks_avg_confint_lower","hooks_avg_confint_upper"],
			   ["conditionals_avg","conditionals_avg_confint_lower","conditionals_avg_confint_upper"],
			   ["est_mem_usage_avg","est_mem_usage_avg_confint_lower","est_mem_usage_avg_confint_upper"]];
	path_to_originals = transformations_path + "original/";
	measured_files = ["Crypto","DeltaBlue","RayTrace","Richards"];
	for file in files_names:
		csv_file_path = evaluation_path + file + "/" + file + ".csv";
		df = pd.read_csv(csv_file_path);
		originals_results = open(path_to_originals + "originals_results.txt");
		values_from_originals= [];
		octane_score_value = {"name": file, "value": 0};
		for line in originals_results:
			m = re.search("(.+?).js", line);
			csv_file_name = m.group(1);
			# Split the measurements from the file name.
			measurements = line.split(" ")[1];
			if csv_file_name == file:
				# Split the "measurements" in the separated values.
				values_from_originals = measurements.split(",");
		for metric in metrics:
			saved_columns = df[metric];
			value_from_original = 0;
			fig = plt.figure()
			if metric == ["octane_score"]:
				tmp_octane = [];
				for j in range(4,11):
					if file == "earley-boyer":
						child = subprocess.Popen("grep EarleyBoyer "+path_to_originals+"/octane/"+"octane_run_"+str(j)+".txt",stdout=subprocess.PIPE,shell=True);
					else:
						for measured in measured_files:
							if measured.lower() == file:
								child = subprocess.Popen("grep " + measured + " "+path_to_originals+"/octane/"+"octane_run_"+str(j)+".txt",stdout=subprocess.PIPE,shell=True);
					output = child.communicate()[0];
					score = output.decode("utf8");
					if score:
						tmp_octane.append(int(score.split(":")[1].replace(" ", "").replace("\n","")));
				octane_score_value["value"] = mean_confidence_interval(tmp_octane,0.95)[0];
			if not metric == ["octane_score"]:
				plt.axhline(round(float(values_from_originals[metrics.index(metric)-1]),2), color="r", linestyle="-");
			else:
				plt.axhline(octane_score_value["value"], color="r", linestyle="-");
			for i in range(len(metric)):
				plt.plot(saved_columns.ix[:,i].values.tolist(), label=metric[i]);
			# Set the axes labels
			plt.xlabel("Transformation")
			plt.ylabel("Measurements")
			# Set the plots label
			plt.title(metric[0]);
			plt.legend();
			# The plot name
			plot_folder = evaluation_path + file + "/" ;
			plot_name = file + "-"+ metric[0]+".png";
			plt.savefig(plot_name);
			subprocess.Popen("mv " + os.getcwd()+"/"+plot_name + " " + plot_folder, shell=True);
			plt.close(fig);


# The following function aggrigates the transformations numbers for each Octane-file
# occordingliy to the file size.
def semilarity (files_names):
	metric=["transformation_number","file_size"]
	for file in files_names:
		csv_file_path = evaluation_path + file + "/" + file + ".csv";
		# Check if "seemingly_equivalent.txt" exists. If so, delete it.
		seemingly_equivalent = evaluation_path + file + "/seemingly_equivalent.txt";
		if Path(seemingly_equivalent).is_file():
			os.remove(seemingly_equivalent, dir_fd=None);
		df = pd.read_csv(csv_file_path);
		tmp = df[metric];
		file_sizes = sorted(list(tmp.agg(metric[1]).unique()));
		equivalent = open(seemingly_equivalent, "a", newline="\n");
		for size in file_sizes:
			equivalent.write(''.join([str(size), ": \n"]));
			list_of_trans = sorted(tmp[metric[0]][tmp[metric[1]] == size].values.tolist());
			equivalent.write(', '.join(str(x) for x in list_of_trans));
			equivalent.write("\n\n");
		equivalent.close();


# The following function aggregates the measurement results and produces a
# CSV-file for each Octane-file. Those are saved in
# "experiments/evaluation/octane_file_name".
def evaluate (transformation, trans_number):
	# Each transformation generate one row in the particular CSV file.
	rows = [];
	for file_name in files_names:
		dict = {"name": file_name, "values": trans_number + ","};
		rows.append(dict);
	data = [];
	for file_name in files_names:
		dict_m = {"name": file_name, "metrics": [[] for _ in range(4)]};
		data.append(dict_m);
	# Iterate over runs in order to generate the contant of the row.
	reg_runfolder = re.compile("run_\d");
	#for f in os.scandir(transformation+"/"): print(f.name);
	runs = [f.path for f in os.scandir(transformation+"/results") if f.is_dir() and f.name.startswith("run_")];
	for run in runs:
		run_results = open(run + "/run_results.txt");
		# For each line in "run_results.txt" do:
		for line in run_results:
			# Search for the file name.
			m = re.search("(.+?).min.js", line);
			csv_file_name = m.group(1);
			# Split the measurements from the file name.
			measurements = line.split(" ")[1];
			# Split the "measurements" in the separated values.
			tmp = measurements.split(",");
			# Add the measured values to the associated vectors with the correct
			# file name.
			for data_m in data:
				if data_m["name"] == csv_file_name:
					for j in range(len(data_m["metrics"])):
						data_m["metrics"][j].append(float(tmp[j]))
			# Append the values from "line" to the appropriate row.
			for item in rows:
				if item["name"] == csv_file_name:
					item["values"] += measurements.replace('\n',',');
	# Gather the files sizes:
	# If the file exisits, append the measurement. Else, append 'NaN'.
	if Path(transformation+"/results/files_sizes.txt").is_file():
		files_sizes = open(transformation+"/results/files_sizes.txt");
		for line in files_sizes:
			# Search for the file name.
			m = re.search("(.+?).min.js", line);
			csv_file_name = m.group(1);
			# Split the file size from the file name.
			file_size = line.split(" ")[1];
			# Append the file size from "line" to the appropriate row.
			for item in rows:
				if item["name"] == csv_file_name:
					item["values"] += file_size.replace('\n','');
	else:
		# Append NaN to the appropriate row.
		for item in rows:
			item["values"] += 'NaN,';
	# Gather the scrores from Octane runs:
	# If the order exisits, calculate the mean of the runs from 4 to 10. Else, append '0'.
	# If there no order in place, then the octane score for the given transformation is '-1'.
	if Path(transformation+"/results/octane/").is_dir():
		measured_files = ["Crypto","DeltaBlue","EarleyBoyer","RayTrace","Richards"];
		for name in measured_files:
			octane_scores = [];
			for j in range(4,11):
				child = subprocess.Popen("grep "+name+" "+transformation+"/results/octane/"+"octane_run_"+str(j)+".txt",stdout=subprocess.PIPE,shell=True);
				output = child.communicate()[0];
				score = output.decode("utf8");
				if score:
					octane_scores.append(int(score.split(":")[1].replace(" ", "").replace("\n","")));
			for item in rows:
				# Handle the NavierStokes Octane test as the separate case, due
				# the fact of the difference between the name of the test in the
				# bencmark Octane and the name of the source file
				if item["name"] == "earley-boyer" and name == "EarleyBoyer":
					if(not len(octane_scores) == 0):
						item["values"] += str(round(mean_confidence_interval(octane_scores,0.95)[0])) + ",";
					else:
						item["values"] += "0,";
				elif item["name"] == name.lower():
					if(not len(octane_scores) == 0):
						item["values"] += str(round(mean_confidence_interval(octane_scores,0.95)[0])) + ",";
					else:
						item["values"] += "0,";
	else:
		# Append NaN to the appropriate row.
		for item in rows:
			item["values"] += "-1,";
	# Search through the list of dictionaries for the right one by
	# the file name. Calculate the confidence interval and average value
	# for each and add the tree values to the right row.
	for item in rows:
		for data_m in data:
			if item["name"] == data_m["name"]:
				dummy = [];
				for vector in data_m["metrics"]:
					# Calculate averages including the associated confidence interval.
					meanconf = list(mean_confidence_interval(vector, 0.95));
					dummy.extend([str(round(val,2)) for val in meanconf]);
				item["values"] += ",".join(dummy);
				del dummy;
	# Create one CSV file for each Octane file, which contains all measurements
	# from all transformations
	for file_name in files_names:
		for item in rows:
			if item["name"] == file_name:
				values = item["values"].split(",");
				tmp_dict = {head_line[0]: values[0]};
				for i in range(1,len(values)):
					dict = {head_line[i]: values[i]};
					dict.update(tmp_dict);
					tmp_dict = dict;
				csv_file_path = evaluation_path + file_name + "/" + file_name + ".csv";
				csv_file = open(csv_file_path, "a", newline="\n");
				csv_writer = csv.DictWriter(csv_file, fieldnames=head_line);
				csv_writer.writerow(tmp_dict);
				csv_file.close();
	# Mark the observed combination as "evaluated"
	new_evaluated.append(trans_number);


# Where all evaluation results are saved.
print("Evaluation directory: /pta-dynamic-analysis/evaluation/\n");
# Check if the folder exisits. If not, create it.
evaluation_path = os.getcwd() + "/evaluation/";
evaluation_dir = Path(evaluation_path);
if(not evaluation_dir.is_dir()): os.makedirs(evaluation_path);
# The name of the files for the evaluation results.
files_names = ["crypto","deltablue","earley-boyer","raytrace","richards"];
# Get the list of all transformations.
transformations_path = os.getcwd() + "/history/";
transformations = [f.path for f in os.scandir(transformations_path) if f.is_dir() and not f.name.startswith("original")];
# Get the list of all evaluated combinations if they are present.
already_evaluated = [];
evaluated_path = evaluation_path + "evaluated_combinations.txt";
if Path(evaluated_path).is_file():
	evaluated = open(evaluated_path, "r", newline="\n");
	for line in evaluated:
		already_evaluated.extend(line.split("\n"));
	evaluated.close();
	if (len(already_evaluated) != 0):
		print("Already evaluated combinations are: " + " ".join(already_evaluated));
else:
	print("This is the very first run of 'evaluation.py' on this mashine.");
	print("At least is 'evaluated_combinations.txt' not in place.");


# Check if the transformations are already evaluated
head_line = ["transformation_number"];
# Check how many Jalangi dynamic analysis runs were executed.
# Assume this number to be constants for all of transformations.
# If it is not the case, "eveluation.py" will throw an error.
number_of_runs = len([f.path for f in os.scandir(transformations[0]+"/results/") if f.is_dir() and f.name.startswith("run_")]);
for j in range(1,number_of_runs+1):
	n = str(j);
	head_line.extend(["run_" + n + "_ct", "run_" + n + "_hooks", "run_" + n + "_conditionals", "run" + n + "_memory_usage"]);
head_line.extend(["file_size","octane_score","ct_avg","ct_avg_confint_lower","ct_avg_confint_upper",
                  "hooks_avg","hooks_avg_confint_lower","hooks_avg_confint_upper",
				  "conditionals_avg","conditionals_avg_confint_lower","conditionals_avg_confint_upper",
				  "est_mem_usage_avg","est_mem_usage_avg_confint_lower","est_mem_usage_avg_confint_upper"]);
# Check if the CSV files are in place. If not, create them including the headline.
for file_name in files_names:
	csv_file_path = evaluation_path + file_name + "/" + file_name + ".csv";
	csv_order_path = evaluation_path + file_name + "/";
	if os.path.isfile(csv_file_path) == False:
		if(not Path(csv_order_path).is_dir()): os.makedirs(csv_order_path);
		csv_file = open(csv_file_path, "w", newline="\n");
		csv_writer = csv.DictWriter(csv_file, fieldnames=head_line);
		csv_writer.writeheader();
		csv_file.close();

# New combinations
new_evaluated = [];
for transformation in transformations:
	# Generate the tranformations number.
	trans_number = str(transformation.rsplit("/",1)[1]);
	# If the "evaluation.py" executed for the first time is, then evaluate all
	# transformation, which present are.
	if len(already_evaluated) == 0:
		evaluate(transformation,trans_number);
	# If there a new, not already evaluated transformation in place is,
	# then evaluate this.
	elif any(trans_number not in x for x in already_evaluated):
		evaluate(transformation,trans_number);
if (len(new_evaluated) != 0):
	print("New evaluated combinations are: " + ", ".join(new_evaluated) + "\n");
	print("Mark those for the future as 'evaluated'.\n");
	evaluated = open(evaluated_path, "a", newline="\n");
	evaluated.write(", ".join(new_evaluated) + " ");
	evaluated.close();
	# Make plots from the evaluations
	print("Plot one graph for each metric for all considered Octane files.\n");
	plots(files_names);
	# Measure the seemingly semilarity of the transformations
	print("Measure the 'seemingly semilarity' of the transformations.\n");
	semilarity(files_names);
	print("\nCheck for all transformed Octane files, which transformation have");
	print("the smallest metrics meausrements and which the highest Octane score.");
	print("If you are interested in the lists of the applied transformations options,");
	print("please take a look in 'experiments/trasformed/transformation_number_from_the_list_below'");
	print("for the file 'compressor_options.txt'.\n");
	finding_min_max(files_names);
else:
	print("No new combinations to evaluate were found!");
