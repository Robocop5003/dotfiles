#!/bin/bash
choices=(
  "  Edit Hyprland config"
  "  Edit Wofi config"
  "  Edit Waybar config"
  "  Edit Neovim config"
  "  Edit Fish config"
)

wybor=$(IFS=$'\n'; echo -e "${choices[*]}" | rofi -dmenu -p "Choose" -i)

case "$wybor" in
    "${choices[0]}")
        kitty --directory ~/.config/hypr -e nvim
        ;;
    "${choices[1]}")
        kitty --directory ~/.config/wofi -e nvim
        ;;
    "${choices[2]}")
        kitty --directory ~/.config/waybar -e nvim
        ;;
    "${choices[3]}")
        kitty --directory ~/.config/nvim -e nvim
        ;;
    "${choices[4]}")
        kitty --directory ~/.config/fish -e nvim config.fish
        ;;
    *)
        exit 0
        ;;
esac
