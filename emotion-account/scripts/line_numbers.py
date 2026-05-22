from pathlib import Path
import sys
path = Path(sys.argv[1])
lines = path.read_text().splitlines()
with open(str(path.parent / (path.name + '.lines')), 'w', encoding='utf-8') as f:
    for i, line in enumerate(lines, 1):
        f.write(f"{i}:{line}\n")
