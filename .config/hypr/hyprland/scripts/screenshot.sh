#!/bin/bash

RANDOM_CHARS=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 8)
FILENAME="screenshot-${RANDOM_CHARS}.png"
FILEPATH="/tmp/$FILENAME"

hyprshot -m region -o /tmp -f "$FILENAME" --silent --frozen
sleep 0.2

if [ -f "$FILEPATH" ]; then
    wl-copy --clear
    echo -n "file://$FILEPATH" | wl-copy -t text/uri-list
    notify-send "Screenshot" "Skopiowano plik: $FILENAME"
else
    notify-send "Screenshot" "Anulowano lub błąd zapisu."
fi
