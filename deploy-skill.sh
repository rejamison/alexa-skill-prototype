#!/bin/bash

# generate the skill from script.txt
pushd cli
node generate_code.js
popd

# zip the skill
pushd skill
npm install
zip -r ../prototype.zip *
popd

# deploy the skill
aws lambda update-function-code --function-name Prototype --zip-file fileb://prototype.zip

# test the skill with a launch request
aws lambda invoke --function-name Prototype --payload file://skill/test.json output.txt
cat output.txt
echo
rm output.txt