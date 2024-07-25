import sys 
import json 
import ast 


input = ast.literal_eval(sys.argv[1])
output = input
print(json.dumps(output))

sys.stdout.flush()