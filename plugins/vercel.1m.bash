#!/bin/bash
export PATH="$PATH:/opt/homebrew/bin/"
filename=$(/usr/bin/readlink vercel.1m.bash)
dir="$(/usr/bin/dirname "$filename")"
parent="$(/usr/bin/dirname "$dir")"
cd $parent
node plugins/vercel.js