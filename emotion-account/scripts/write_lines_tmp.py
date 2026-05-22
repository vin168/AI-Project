from pathlib import Path
import sys
path = Path(sys.argv[1])
with open('d:/emotion-account/tmp_index_lines.txt', 'w', encoding='utf-8') as f:
    for i, line in enumerate(path.read_text(encoding='utf-8').splitlines(), 1):
        f.write(f"{i}:{line}\n")
