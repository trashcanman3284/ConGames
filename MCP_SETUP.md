# MCP Setup — Dad se Speletjies

## TL;DR — What MCPs Do You Actually Need?

For this project (local HTML/CSS/JS, no backend, no external APIs), you need very few MCPs.
Here's the honest list ranked by value:

---

## ✅ Recommended: Install These

### 1. Filesystem MCP
**Why:** Lets Claude Code read/write files across the project without needing to be run from a specific directory. Useful for cross-referencing `words.json`, `shared.css`, and game files simultaneously.

```bash
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem /home/trashdev/projects/congames
```

> Only grant access to the congames folder. No need to expose your whole home dir.

---

### 2. Sequential Thinking MCP
**Why:** Forces Claude Code to reason step-by-step before writing code. Especially useful for the puzzle engine logic (Woord Soek placement, Sudoku backtracking, FreeCell move validation). Reduces dumb mistakes.

```bash
claude mcp add sequentialthinking -- npx -y @modelcontextprotocol/server-sequential-thinking
```

---

### 3. Web Search / Fetch MCP (optional but handy)
**Why:** When Claude Code needs to check browser API compatibility, look up exact Sudoku algorithms, or verify PWA Builder steps — without leaving the terminal.

Good option: `mcp-omnisearch` (bundles Brave + Tavily search + web fetch):
```bash
claude mcp add --transport stdio mcp-omnisearch -- npx -y mcp-omnisearch
# You'll need at least one of: TAVILY_API_KEY, BRAVE_API_KEY in env
```

Or simpler — just the Anthropic fetch tool (built into Claude Code, no setup needed).

---

## ❌ Skip These (not needed for this project)

| MCP | Why Skip |
|---|---|
| GitHub MCP | No git repo needed for a personal sideload project |
| Supabase / PostgreSQL | No backend — all data in localStorage |
| Figma MCP | No Figma designs — build directly |
| Jira / Linear | Personal project, use GSD.md instead |
| Slack / Gmail | No team communication needed |
| Playwright | Testing is manual (Chrome DevTools + real tablet) |

---

## Project-Scoped MCP Config

Create `.mcp.json` in your project root to share config automatically:

```json
{
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/home/trashdev/projects/congames"
      ]
    },
    "sequential-thinking": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

Place this at `/home/trashdev/projects/congames/.mcp.json` and Claude Code will load it automatically when you `cd` into the project.

---

## Claude Code Settings

Create `.claude/settings.json` in the project:

```json
{
  "model": "claude-sonnet-4-5",
  "autoApprove": [
    "Read",
    "Write",
    "Edit",
    "Bash(python3*)",
    "Bash(ls*)",
    "Bash(cat*)",
    "Bash(mkdir*)",
    "Bash(cp*)"
  ]
}
```

This auto-approves safe file operations so you're not clicking "allow" constantly.

---

## Suggested Claude Code Workflow

### Starting a session
```bash
cd /home/trashdev/projects/congames
claude
```

Claude Code will auto-read `CLAUDE.md` and know the full project context.

### Useful slash commands
```
/init          # Re-read CLAUDE.md and rebuild project understanding
/mcp           # Check MCP server status
/clear         # Clear context window (use when context gets too large)
/cost          # See token usage for the session
```

### Prompting tips for this project

**For game engines — be specific:**
```
Build games/woordsoek/engine.js as described in CLAUDE.md Phase 3 spec.
Use the Sequential Thinking MCP to plan word placement before writing code.
Export a single WoordSoekEngine object (IIFE pattern, no ESM imports).
```

**For UI work:**
```
Build games/woordsoek/index.html and ui.js.
Follow the design system in css/shared.css exactly.
Test mentally against Chrome DevTools 2000x1200 landscape with touch.
Minimum tap targets: 56px.
```

**For debugging:**
```
The word selection isn't working correctly — tap first cell, tap last cell,
nothing highlights. Check games/woordsoek/ui.js touch event handling.
```

---

## Why No GitHub MCP?

This is a personal project with no team, no CI, no PRs. The overhead of setting up GitHub auth isn't worth it for a one-dev family project.

If you want version control, just use git directly:
```bash
git init
git add -A
git commit -m "Phase 3: Woord Soek complete"
```

Claude Code can run git commands natively without an MCP.

---

## Cost Estimate

Claude Code uses Sonnet 4 by default. For this project:
- Each game phase ≈ 50K–150K tokens
- 5 games × 100K avg = ~500K tokens
- At Sonnet 4 pricing ≈ **$1.50–$4.00 total** for the whole project

Use `/cost` in Claude Code to track spend per session.
