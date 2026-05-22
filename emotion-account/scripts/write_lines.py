from pathlib import Path
import sys
path = Path(sys.argv[1])
out_path = path.parent / f"{path.name}.lines"
with open(out_path, 'w', encoding='utf-8') as out:
    for i, line in enumerate(path.read_text(encoding='utf-8').splitlines(), 1):
        out.write(f"{i}:{line}\n")
print(out_path)
