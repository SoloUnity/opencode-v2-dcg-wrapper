// OpenCode V2 adapter for Destructive Command Guard.
// Keep this path absolute because OpenCode can run with a reduced PATH.
const DCG_BIN = "/Users/gordon.ng/.local/bin/dcg"
const DCG_TIMEOUT_MS = 3_000
const DCG_MAX_OUTPUT_BYTES = 1_048_576

function verificationError(reason) {
  return new Error(
    `[dcg] Safety check failed: ${reason}. The shell command was blocked because dcg could not verify it.`,
  )
}

async function checkCommand(command) {
  let stdoutText
  let stderrText
  let exitCode
  let signalCode

  try {
    const proc = Bun.spawn([DCG_BIN], {
      stdin: new TextEncoder().encode(
        JSON.stringify({ tool_name: "Bash", tool_input: { command } }),
      ),
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, OPENCODE: "1" },
      timeout: DCG_TIMEOUT_MS,
      killSignal: "SIGKILL",
      maxBuffer: DCG_MAX_OUTPUT_BYTES,
    })

    const results = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ])
    stdoutText = results[0]
    stderrText = results[1]
    exitCode = results[2]
    signalCode = proc.signalCode
  } catch (error) {
    throw verificationError(`could not run dcg (${error})`)
  }

  if (signalCode) {
    throw verificationError(
      `dcg timed out after ${DCG_TIMEOUT_MS} ms or was terminated (${signalCode})`,
    )
  }

  if (exitCode !== 0) {
    const detail = (stderrText || "").trim().slice(0, 500)
    throw verificationError(`dcg exited with code ${exitCode}${detail ? `: ${detail}` : ""}`)
  }

  const text = (stdoutText || "").trim()
  if (!text) return

  let decision
  try {
    decision = JSON.parse(text)
  } catch {
    throw verificationError("dcg returned invalid JSON")
  }

  const output = decision.hookSpecificOutput
  const verdict = output?.permissionDecision
  if (verdict === "deny" || verdict === "ask") {
    throw new Error(output.permissionDecisionReason || "Blocked by dcg")
  }

  if (verdict !== "allow") {
    throw verificationError("dcg returned an unknown decision")
  }
}

export default {
  id: "opencode-v2-dcg-wrapper",
  async setup(ctx) {
    await ctx.shell.hook("create.before", async (event) => {
      if (typeof event.command !== "string" || event.command.length === 0) return
      await checkCommand(event.command)
    })
  },
}
