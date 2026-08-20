import os
import re
import ast
import sys

def get_imports(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        try:
            tree = ast.parse(f.read())
        except Exception:
            return set()
    imports = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for n in node.names:
                imports.add(n.name.split('.')[0])
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                imports.add(node.module.split('.')[0])
    return imports

all_imports = set()
for d in ['c:/VS/health-risk-predictor/backend/app', 'c:/VS/health-risk-predictor/ml']:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith('.py'):
                all_imports.update(get_imports(os.path.join(root, file)))

# Filter out standard library
import sysconfig
stdlib = set(sys.builtin_module_names) | set(sys.modules.keys())

filtered = [imp for imp in all_imports if imp not in stdlib and imp != 'app' and imp != 'heart']

print(sorted(filtered))
