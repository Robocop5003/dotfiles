#!/usr/bin/env bash

getdate() {
    date '+%Y-%m-%d_%H.%M.%S'
}
getaudiooutput() {
    pactl list sources | grep 'Name' | grep 'monitor' | cut -d ' ' -f2
}
getactivemonitor() {
    hyprctl monitors -j | jq -r '.[] | select(.focused == true) | .name'
}

xdgvideo="$(xdg-user-dir VIDEOS)"
if [[ $xdgvideo = "$HOME" ]]; then
  unset xdgvideo
fi
mkdir -p "${xdgvideo:-$HOME/Videos}"
cd "${xdgvideo:-$HOME/Videos}" || exit

if pgrep wf-recorder > /dev/null; then
    notify-send "Recording Stopped" "Stopped" -a 'Recorder' &
    pkill wf-recorder &
else
    notify-send "Starting recording" 'recording_'"$(getdate)"'.mp4' -a 'Recorder'
    
    wf-recorder -o $(getactivemonitor) --pixel-format yuv420p -r 60 -c libx264 -p crf=28 -f './recording_'"$(getdate)"'.mp4' -t --audio="$(getaudiooutput)" & disown
fi
