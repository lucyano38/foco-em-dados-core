#!/bin/bash
set -euo pipefail

cd ~/foco-em-dados-core

git status --short

git remote set-url origin https://github.com/lucyano38/foco-em-dados-core.git

git push origin main
