#!/bin/bash

# deploy the skill
pushd skill
zip -r ../prototype.zip *
popd

sudo aws lambda update-function-code --function-name Prototype --zip-file fileb://prototype.zip
sudo aws lambda invoke --function-name Prototype --payload file://skill/test.json output.txt
cat output.txt
echo
sudo rm output.txt