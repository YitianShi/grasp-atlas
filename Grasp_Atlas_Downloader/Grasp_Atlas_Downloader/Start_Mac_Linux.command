#!/bin/sh
cd -- "$(dirname -- "$0")" || exit 1
python3 start_download.py "$@"
status=$?
printf '\nFinished or paused. Press Enter to close.\n'
read -r answer
exit "$status"
