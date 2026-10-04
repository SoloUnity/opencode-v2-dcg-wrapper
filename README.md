# opencode-v2-dcg-wrapper

This plugin is the local OpenCode V2 wrapper used by the setup. It checks shell
commands with the separately installed
[Destructive Command Guard](https://github.com/Dicklesworthstone/destructive_command_guard)
binary before OpenCode runs them.

## Install

Install `dcg` from its upstream project first. The plugin uses `DCG_BIN` when
set. Without it, it uses `$HOME/.local/bin/dcg`, which is the default location
used by the current setup. Set the variable when DCG is installed elsewhere:

```sh
export DCG_BIN="$(command -v dcg)"
```

OpenCode loads this file automatically when it is linked as
`~/.config/opencode/plugins/opencode-v2-dcg-wrapper.js`.

The plugin fails closed when the safety evaluation cannot run or returns an
unknown result. The DCG binary is not included in this repository. DCG has its
own license and release policy.

## License

The adapter in this repository is MIT licensed. It calls DCG as an external
program and does not contain DCG source code.
