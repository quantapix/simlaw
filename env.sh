#!/bin/bash

# set -xeu -o pipefail

# python -m ipykernel install --user --name qenv --display-name "Python (.env)"
# jupyter notebook --no-browser --port=8889
# ssh -N -f -L localhost:8888:localhost:8889 remote_user@remote_host

# jupyter nbconvert --to script 

show_usage() {
    echo "Usage: $(basename "$0") [-c] [-g]"
}

main() {
    local OPTIND=1
    local GPU=false
    local CLEAN=false

    while getopts "cgh" opt; do
	      case $opt in
	          c) CLEAN=true;;
            g) GPU=true;;
	          *) show_usage; return 1;;
	      esac
    done
    shift $((OPTIND-1))

    if "$CLEAN"; then
	      rm -rf .env
    fi

    if [ ! -e .env ]; then
	      python3.10 -m venv .env
    fi

    .env/bin/pip install -U pip wheel setuptools pytest black
    .env/bin/pip install -U numpy pandas matplotlib scipy scikit-learn
}

main "$@"
