#!/bin/bash

if [ "$OSTYPE" != "msys" ] && [ "$OSTYPE" != "win32" ] && [ "$OSTYPE" != "win64" ]; then
<<<<<<< .merge_file_Wib1J8
    node `which istanbul` cover --report lcov _mocha -- --ui tdd --recursive --reporter spec compile/test/**/*.spec.js --timeout 100s
=======
    PREPARE;

    node `which istanbul` cover --report lcov _mocha -- --ui tdd --recursive --reporter spec compile/test/**/*.spec.js --timeout 100s

>>>>>>> .merge_file_coOhwu
elif [ "$OSTYPE" == "win32" ] || [ "$OSTYPE" == "win64" ]; then
    echo "You should have installed and configured http://git-scm.com/ and run all bash command by using git-bash.exe"
elif [ -d 'compile/' ]; then
    echo "Running from git-bash without gathering coverage"
    
    node `which _mocha` --ui tdd --recursive --reporter spec compile/test/**/*.spec.js
else
   echo "Skipping testing..."
fi
