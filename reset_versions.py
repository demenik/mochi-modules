import os
import re


def read_version(module):
    with open(f"version-{module}.txt", "r") as f:
        return f.read()


def revert_version(module, version):
    with open(f"src/{module}/index.ts", "r") as f:
        content = f.read()

    version = re.search(r'version: "(\d+\.\d+\.\d+)"', content).group(1)
    new_version = read_version(module)
    content = content.replace(version, new_version)

    with open(f"src/{module}/index.ts", "w") as f:
        f.write(content)


def get_modules():
    return [
        module
        for module in os.listdir("src")
        if os.path.isfile(f"src/{module}/index.ts")
        and os.path.isfile(f"version-{module}.txt")
    ]


modules = get_modules()
for module in modules:
    revert_version(module, read_version(module))
    os.remove(f"version-{module}.txt")
