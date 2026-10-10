#!/bin/bash

PL="1. 🇵🇱 Polski"
RU="2. 🇷🇺 Rosyjski"
CN="3. 🇨🇳 Chiński"
JP="4. 🇯🇵 Japoński"

echo -e "$PL\n$RU\n$CN\n$JP" | rofi -dmenu \
    -p "Układ" \
    -theme-str 'inputbar { children: [prompt]; }' \
    -theme-str 'listview { lines: 4; }' \
    -kb-custom-1 "1" \
    -kb-custom-2 "2" \
    -kb-custom-3 "3" \
    -kb-custom-4 "4" > /dev/null

EXIT_CODE=$?

case $EXIT_CODE in
    10)
        fcitx5-remote -s keyboard-pl
        ;;
    11)
        fcitx5-remote -s keyboard-ru-phonetic
        ;;
    12)
        fcitx5-remote -s keyboard-cn
        ;;
    13)
        fcitx5-remote -s mozc
        ;;
    *)
        exit 0
        ;;
esac
