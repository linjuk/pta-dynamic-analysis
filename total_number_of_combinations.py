import math;
import numpy;
from scipy.special import comb;

n = 18; k = list(range(1,19)); total_number_of_combinations = 0;
for i in k: number = comb(n, i, exact = True); total_number_of_combinations += number ;# print(number);
print("""The total number of all possible combinations for compressor options""", total_number_of_combinations);
