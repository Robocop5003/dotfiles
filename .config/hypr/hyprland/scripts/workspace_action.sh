#!/usr/bin/env bash
hyprctl dispatch "$1" $((($(hyprctl activeworkspace -j | jq -r .id)  / 10) * 10 + $2))

