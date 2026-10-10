import app from "ags/gtk4/app"
import { Gtk, Gdk } from "ags/gtk4"
import { createBinding, createState } from "ags"
import { subprocess, exec, execAsync, createSubprocess } from "ags/process"
import GLib from "gi://GLib"
import Astal from "gi://Astal?version=4.0"
import Mpris from "gi://AstalMpris"
import Hyprland from "gi://AstalHyprland"
import Workspace from "gi://AstalWorkspace"
import Gio from "gi://Gio";
import { createPoll } from "ags/time";

const [ramUsage, setRamUsage] = createState(0);

async function updateRam() {
  try {
    const available = await execAsync([`bash`, `-c`, `awk '/MemAvailable/ {print $2}' /proc/meminfo`]);
    const total = await execAsync([`bash`, `-c`, `awk '/MemTotal/ {print $2}' /proc/meminfo`]);

    const totalInt = parseInt(total, 10);
    const availableInt = parseInt(available, 10);
    const usedInt = totalInt - availableInt;

    if (!isNaN(totalInt) && !isNaN(availableInt)) {
      const percentage = Math.round((usedInt / totalInt) * 100);

      setRamUsage(percentage);
    }
  } catch (err) {
    console.error("Błąd pobierania RAM:", err);
  }
}

GLib.timeout_add(GLib.PRIORITY_DEFAULT, 2000, () => {
  updateRam();
  return true;
})

updateRam();

export function Clock() {
  const time = createPoll("", 1000, () => {
    return GLib.DateTime.new_now_local().format("%H:%M")!
  })
  const date = createPoll("", 60000, () => {
    return GLib.DateTime.new_now_local().format("%A, %d %B")!
  })
  return (
    <menubutton cssClasses={["clock"]}>
      <box orientation={Gtk.Orientation.VERTICAL} cssClasses={["clock-labels"]}>
        <label name="clock-time" label={time} />
        <label name="clock-date" label={date} />
      </box>

      <popover>
        <box cssClasses={["calendar-popover"]}>
          <Gtk.Calendar />
        </box>
      </popover>
    </menubutton>
  )
}

export function Workspaces() {
  const hyprland = Hyprland.get_default()
  const container = new Gtk.Box({ css_classes: ["workspaces"] });
  const scroll = new Gtk.EventControllerScroll({
    flags: Gtk.EventControllerScrollFlags.VERTICAL
  });

  scroll.connect("scroll", (_, dx, dy) => {
    const current = hyprland.focusedWorkspace?.id || 1;
    if (dy > 0) {
      hyprland.dispatch("workspace", String(current + 1));
    } else if (dy < 0 && current > 1) {
      hyprland.dispatch("workspace", String(current - 1));
    }
  });

  container.add_controller(scroll);
  const updateUI = () => {
    let child = container.get_first_child()

    while (child) {
      const next = child.get_next_sibling()
      container.remove(child)
      child = next
    }

    const activeIds = hyprland.workspaces.map(ws => ws.id).filter(id => id > 0)
    const focusedId = hyprland.focusedWorkspace?.id || 1
    const baseIds = [1, 2, 3, 4, 5, 6, ...activeIds, focusedId]
    const maxId = Math.max(...baseIds)

    if (maxId <= 6) {
      baseIds.push(7)
    }

    const uniqueIds = new Set(baseIds)
    const allIds = Array.from(uniqueIds).sort((a, b) => a - b)

    const romanMap: { [key: number]: string } = {
      1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII", 8: "VIII", 9: "IX", 10: "X"
    }

    allIds.forEach(id => {
      const isActive = focusedId === id

      const btn = new Gtk.Button({
        label: romanMap[id] || String(id),
        css_classes: isActive ? ["active"] : []
      })

      btn.connect("clicked", () => {
        hyprland.dispatch("workspace", String(id))
      })

      container.append(btn)
    })
  }

  hyprland.connect("notify::workspaces", updateUI)
  hyprland.connect("notify::focused-workspace", updateUI)

  updateUI()

  return container
}

export function Media() {
  const mpris = Mpris.get_default();
  const iconLabel = <label /> as any;

  const visBars = Array.from({ length: 40 }, () => {
    const box = new Gtk.Box({
      css_classes: ["vis-bar"],
      valign: Gtk.Align.CENTER
    });
    box.set_size_request(-1, 4);
    return box;
  });

  const visualizer = (
    <box cssClasses={["visualizer"]} valign={Gtk.Align.CENTER}>
      {visBars}
    </box>
  ) as any;

  const innerBox = (
    <box cssClasses={["mpris-content"]} spacing={8}>
      {iconLabel}
      {visualizer}
    </box>
  ) as any;

  const btn = new Gtk.Button({ child: innerBox });
  const gesture = new Gtk.GestureClick();
  gesture.set_button(3);
  gesture.connect("pressed", () => {
    const player = mpris.get_players()[0];
    if (player) player.play_pause();
  });
  btn.add_controller(gesture);

  let cavaProc: any = null;
  let cavaRunning = false;

  const stopCava = () => {
    if (cavaProc) {
      cavaProc.force_exit();
      cavaProc = null;
    }
    cavaRunning = false;
    visBars.forEach(bar => bar.set_size_request(-1, 4));
  };

  const startCava = () => {
    if (cavaRunning) return;
    cavaRunning = true;

    const cavaCmd = `cava -p ~/.config/ags/cava.conf`;

    try {
      cavaProc = new Gio.Subprocess({
        argv: ['bash', '-c', cavaCmd],
        flags: Gio.SubprocessFlags.STDOUT_PIPE,
      });
      cavaProc.init(null);

      const pipe = cavaProc.get_stdout_pipe();
      if (!pipe) return;

      const stream = new Gio.DataInputStream({
        base_stream: pipe,
        close_base_stream: true,
      });

      const readLine = () => {
        if (!cavaRunning) return;
        stream.read_line_async(0, null, (s, res) => {
          if (!cavaRunning) return;
          try {
            const [line] = s.read_line_finish_utf8(res);
            if (line !== null) {
              const values = line.split(';').map(v => parseInt(v)).filter(v => !isNaN(v));
              if (values.length === 40) {
                values.forEach((val, i) => {
                  visBars[i].set_size_request(-1, 4 + val);
                });
              }
              readLine();
            }
          } catch (e) {
            stopCava();
          }
        });
      };
      readLine();
    } catch (err) {
      console.error("Błąd uruchamiania cava", err);
      stopCava();
    }
  };

  const updateUI = () => {
    const player = mpris.get_players()[0];

    if (!player) {
      iconLabel.label = "󰓛";
      innerBox.cssClasses = ["mpris-content", "stopped"];
      stopCava();
      return;
    }

    const status = player.playbackStatus;
    if (status === Mpris.PlaybackStatus.PLAYING) {
      iconLabel.label = "󰏤";
      innerBox.cssClasses = ["mpris-content", "playing"];
      startCava();
    } else {
      iconLabel.label = status === Mpris.PlaybackStatus.PAUSED ? "󰐊" : "󰓛";
      innerBox.cssClasses = ["mpris-content", status === Mpris.PlaybackStatus.PAUSED ? "paused" : "stopped"];
      stopCava();
    }
  };

  let currentPlayer: any = null;
  const syncSignals = () => {
    const player = mpris.get_players()[0];
    if (player !== currentPlayer) {
      currentPlayer = player;
      if (player) {
        player.connect("notify::playback-status", updateUI);
      }
    }
    updateUI();
  };

  mpris.connect("notify::players", syncSignals);
  syncSignals();

  return (
    <box cssClasses={["mpris"]}>
      {btn}
    </box>
  );
}

export function RamWidget() {
  return (
    <box cssClasses={["ram-widget"]}>
      <label label={ramUsage((usage) => `   RAM: ${usage}%`)} />
    </box>
  )
}

export default function Bar(gdkmonitor: Gdk.Monitor) {
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

  return (
    <window
      visible
      name="bar"
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP | LEFT | RIGHT}
      application={app}
    >
      <centerbox>

        <box $type="start" cssClasses={["modules-left"]}>
          {/* Tutaj wstawisz kod dla: logo, workspaces, mpris */}
          <Workspaces />
          <Media />
        </box>

        <box $type="center" cssClasses={["modules-center"]}>
          <Clock />
        </box>

        <box $type="end" cssClasses={["modules-right"]}>
          {/* Tutaj wstawisz kod dla: cpu, separator, memory, notification */}
          <RamWidget />
        </box>

      </centerbox>
    </window>
  )
}

export { ramUsage }
