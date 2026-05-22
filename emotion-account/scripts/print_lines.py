from pathlib import Path
import sys
path = Path(sys.argv[1])
for i, line in enumerate(path.read_text().splitlines(), 1):
    print(f"{i}:{line}")
