## Exercise: Translation Checker Skill Eval

### Goal

Measure whether a translation-checker skill finds missing translations with less exploration and fewer misses.

### Setup

- Use isolated runs or git worktrees.
- Start from `.backup/swe-advanced/030-translation-checker-skill-eval/starter-repo/`.
- Run the LeBonPoint-style frontend fixture with `npm run app`.
- Use the tiny fixture with one source locale, `en`, and two target locales, `fr` and `oc`.
- The target locales contain deliberate gaps so the ground-truth missing keys are known before you run the eval.

### Tasks

1. Define the ground truth by listing the exact missing keys directly from the locale files before running the agent.
2. Run a WITH-skill batch and a WITHOUT-skill batch against the same fixture and save the JSONL transcripts.
3. Parse transcripts to count tool calls, API turns, and token usage.
4. Compare each run's reported missing keys against the ground truth and record false positives and false negatives.
5. Check the final worktree diff and flag any file edits outside the allowed fixture or report path.
6. Run a quick trigger eval with one prompt that should load the skill and one that should not.

### Bonus Goal

Use `/goal` to let the agent improve the skill instructions automatically after the first eval report.

```text
/goal the translation-checker skill is improved, proven by `npm run smoke`
showing the WITH-skill run has 0 false positives, 0 false negatives,
no diff violations, and trigger eval has 0 failures; only
`.backup/swe-advanced/030-translation-checker-skill-eval/starter-repo/skills/translation-checker/SKILL.md`,
transcript fixtures, and reports may change; stop after 6 turns with blockers.
```

Keep this as a completion condition, not a vague instruction. The evaluator only sees the transcript, so the agent must print the relevant smoke-report evidence before stopping.

### Success Criteria

- Missing-translation accuracy is measured against the locale files, not the agent's confidence.
- Tool calls, API turns, and token usage come from JSONL transcripts.
- False positives, false negatives, and violations are explicitly counted.
- Trigger accuracy is tested separately from performance.
- The fixture and prompt set remain small enough for a 30-minute exercise.
