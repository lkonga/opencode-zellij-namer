import type { TuiPlugin, TuiPluginModule } from "@opencode-ai/plugin/tui";
import {
  loadNoiseConfig,
  addNoiseCommand,
  removeNoiseCommand,
  addNoisePattern,
  removeNoisePattern,
  resetNoiseConfig,
  getNoiseCommands,
  getNoisePatterns,
} from "./noise.js";

const tui: TuiPlugin = async (api) => {
  loadNoiseConfig({
    noiseExtra: process.env.OPENCODE_ZN_NOISE_EXTRA || "",
    noisePatterns: process.env.OPENCODE_ZN_NOISE_PATTERNS || "",
  });

  api.command.register(() => [
    {
      title: "Add noise command",
      value: "zellij-namer-add",
      category: "Zellij Namer",
      description: "Add a command to the noise filter (e.g., /zellij-namer add ls)",
      slash: { name: "zellij-namer", aliases: ["zn"] },
      onSelect: () => {},
    },
  ]);

  const unsub = api.event.on("session.idle", (event) => {
    const msgs = (event as any).messages ?? [];
    const lastMsg = msgs[msgs.length - 1];
    if (!lastMsg?.content || typeof lastMsg.content !== "string") return;

    const content = lastMsg.content.trim();
    if (!content.startsWith("/zellij-namer ") && !content.startsWith("/zn ")) return;

    const prefix = content.startsWith("/zn ") ? 4 : 14;
    const parts = content.slice(prefix).trim().split(/\s+/);
    const sub = parts[0];
    const args = parts.slice(1);

    if (sub === "add" && args[0]) {
      addNoiseCommand(args[0]);
      api.ui.toast({ variant: "success", title: "Noise: Added", message: `"${args[0]}" to noise filter (${getNoiseCommands().length} total)` });
    } else if (sub === "remove" && args[0]) {
      removeNoiseCommand(args[0]);
      api.ui.toast({ variant: "info", title: "Noise: Removed", message: `"${args[0]}" from noise filter` });
    } else if (sub === "pattern" && args[0] === "add" && args[1]) {
      const source = args.slice(1).join(" ");
      try {
        addNoisePattern(new RegExp(source, "i"));
        api.ui.toast({ variant: "success", title: "Noise: Pattern Added", message: `/${source}/i` });
      } catch {
        api.ui.toast({ variant: "error", title: "Noise: Invalid Regex", message: source });
      }
    } else if (sub === "pattern" && args[0] === "remove" && args[1]) {
      const source = args.slice(1).join(" ");
      if (removeNoisePattern(source)) {
        api.ui.toast({ variant: "info", title: "Noise: Pattern Removed", message: `/${source}/i` });
      } else {
        api.ui.toast({ variant: "warning", title: "Noise: Pattern Not Found", message: `/${source}/i` });
      }
    } else if (sub === "list") {
      const cmds = getNoiseCommands();
      const patterns = getNoisePatterns();
      api.ui.toast({
        variant: "info",
        title: "Noise Filter",
        message: `${cmds.length} commands: ${cmds.slice(0, 8).join(", ")}${cmds.length > 8 ? "..." : ""} | ${patterns.length} patterns`,
        duration: 5000,
      });
    } else if (sub === "reset") {
      resetNoiseConfig();
      api.ui.toast({ variant: "info", title: "Noise: Reset", message: "Restored factory defaults" });
    }
  });

  api.lifecycle.onDispose(unsub);
};

export default { tui } satisfies TuiPluginModule;
