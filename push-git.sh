#!/bin/bash

message="${1:-'lazy commit'}"

git add .
git commit -m "$message"
git push
