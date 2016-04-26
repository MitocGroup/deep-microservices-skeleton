#!/usr/bin/env bash
babel=$(which babel)

if [ -z ${babel} ]; then
    echo "Seems like babel is not installed! Installing babel v6 as default transpiler..."
    echo ""
    npm install babel-cli@6.x -g

    babel=$(which babel)
    babel_version=$(babel --version)

    echo "Installed babel ${babel_version}"
fi

NPM_GLOBAL_NM=`npm root -g`

 ! [ -d ${NPM_GLOBAL_NM}/babel-preset-es2015 ] && npm install -g babel-preset-es2015;
 ! [ -d ${NPM_GLOBAL_NM}/babel-plugin-add-module-exports ] && npm install -g babel-plugin-add-module-exports;

babel-node `dirname $0`/repository_update.js --presets ${NPM_GLOBAL_NM}/babel-preset-es2015 --plugins ${NPM_GLOBAL_NM}/babel-plugin-add-module-exports $1

exit 0