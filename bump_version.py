import re
import sys
import os

if len(sys.argv) != 2:
    print("Usage: python3 bump_version.py <file_edited>")
    sys.exit(1)

module = re.match(r"src\/[^/]+\/", sys.argv[1]).group(0)

if not os.path.exists(module + "index.ts"):
    print(f"{module}/index.ts not found")
    sys.exit(2)


def increment_version(version):
    major, minor, patch = [int(x) for x in version.split(".")]
    patch += 1
    return f"{major}.{minor}.{patch}"


def update_version(file_path):
    with open(file_path, "r") as f:
        content = f.read()

    version = re.search(r'version: "(\d+\.\d+\.\d+)"', content).group(1)
    new_version = increment_version(version)
    content = content.replace(version, new_version)

    with open(file_path, "w") as f:
        f.write(content)


update_version(module + "index.ts")
