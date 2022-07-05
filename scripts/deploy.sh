#!/usr/bin/env bash

cd "$( dirname -- "$0"; )" || exit
cd ..

echo ">> Building project"
yarn build

echo ">> Deploying to Firebase (only hosting)"
firebase deploy --only hosting
