#!/bin/bash

# set -xeu -o pipefail

# python -m ipykernel install --user --name qenv --display-name "Python (.env)"
# jupyter notebook --no-browser --port=8889
# ssh -N -f -L localhost:8888:localhost:8889 remote_user@remote_host

# jupyter nbconvert --to script 

show_usage() {
    echo "Usage: $(basename "$0") [-c] [-t]"
}

main() {
    local OPTIND=1
    local CLEAN=false
    local TEST=false

    while getopts "cth" opt; do
	      case $opt in
	          c) CLEAN=true;;
            t) TEST=true;;
	          *) show_usage; return 1;;
	      esac
    done
    shift $((OPTIND-1))

    if "$CLEAN"; then
	      rm -rf .env
        (cd lib/jupyterlab
            git clean -dfxq
            git reset --hard
        )
    fi

    if [ ! -e .env ]; then
	      python3.10 -m venv .env
    fi

    .env/bin/pip install -U pip wheel setuptools
    # .env/bin/pip install -U pytest black
    # .env/bin/pip install -U numpy pandas matplotlib scipy scikit-learn

    (cd lib/jupyterlab
        source ../../.env/bin/activate
        pip install -e ".[test]"
        jlpm install
        jlpm run build
        jlpm run build:core
        jupyter lab build
        if "$TEST"; then
            jlpm run build:testutils
            jlpm test
        fi
    )

    # .env/bin/pip install -U jupyterlab_server
}

main "$@"
