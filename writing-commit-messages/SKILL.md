---
name: writing-commit-messages
description: Use when creating commit messages, git commit descriptions, or jj change descriptions - enforces the seven rules from cbea.ms/git-commit (50-char subject, imperative mood, wrapped body explaining what and why)
---

# Writing Commit Messages

## Overview

Professional commit messages follow seven rules that make history readable and useful. Subject line states what the commit does (imperative, ≤50 chars), body explains what changed and why (wrapped at 72 chars).

## When to Use

- Creating any commit message or change description
- Using `git commit`, `jj describe`, or similar commands
- Reviewing/editing existing commit messages
- Automating commit message generation

## Quick Reference

| Rule | Requirement |
|------|-------------|
| **Subject length** | ≤50 chars ideal, 72 hard limit |
| **Subject mood** | Imperative ("Add feature" not "Added feature") |
| **Subject format** | Capitalize first word, no period at end |
| **Separation** | Blank line between subject and body |
| **Body wrap** | Hard wrap at 72 characters |
| **Body content** | Explain WHAT and WHY, not how |
| **Body requirement** | Required for non-trivial changes |

**Test your subject:** "If applied, this commit will **[your subject line]**" should read correctly.

## Core Pattern

### ❌ Before (Common Failures)
```
Normalize email input and use async bcrypt comparison in auth functions

This change standardizes email handling by converting to lowercase and trimming whitespace before database lookups, and replaces synchronous bcrypt.compareSync with the async bcrypt.compare method for better performance and security practices.
```

**Problems:**
- Subject: 76 chars (exceeds 50, breaks 72 limit)
- Body: 177 chars on one line (should wrap at 72)

### ✅ After (Correct Format)

```
Normalize email and use async bcrypt in auth

Standardizes email handling by converting to lowercase and
trimming whitespace before database lookups. This prevents
duplicate accounts from case/whitespace variations.

Replaces bcrypt.compareSync with async bcrypt.compare for
better performance and to avoid blocking the event loop during
password verification.
```

**Improvements:**
- Subject: 45 chars (under 50)
- Body: wrapped at 72 chars
- Explains what and why, not implementation details

## When Body is Optional

**Body required for:**
- Feature additions
- Bug fixes (explain the bug and why this fixes it)
- Refactorings (explain motivation)
- Breaking changes
- Non-obvious changes

**Body optional for:**
- Trivial typo fixes (single word/character)
- Obvious formatting changes
- Version bumps with no functional change

**When in doubt:** Include a body. More context is better than less.

## The Seven Rules

1. **Separate subject from body with a blank line**
   - Blank line is mandatory if body exists
   - Tools like `git log --oneline` depend on this

2. **Limit the subject line to 50 characters**
   - 50 is ideal, 72 is hard limit
   - GitHub truncates at 72 with ellipsis
   - Forces concise thinking

3. **Capitalize the subject line**
   - First word always capitalized
   - Example: "Add feature" not "add feature"

4. **Do not end the subject line with a period**
   - Periods waste space in subject line
   - Treat it like a title

5. **Use the imperative mood in the subject line**
   - "Add feature" (command) not "Added feature" (past tense)
   - Test: "If applied, this commit will [your subject]"
   - Matches git's own convention ("Merge branch...")

6. **Wrap the body at 72 characters**
   - Hard wrap, not soft wrap
   - Allows git to indent while staying under 80 chars
   - Break long sentences across multiple lines

7. **Use the body to explain what and why vs. how**
   - Code shows how
   - Commit message explains what changed and why
   - Focus on motivation and context

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Subject >50 chars | Trim to essentials, move details to body |
| Past tense ("Added X") | Use imperative ("Add X") |
| Period at end of subject | Remove it |
| Body on one long line | Hard wrap at 72 chars |
| Body explains how | Explain what and why instead |
| No body for complex change | Always include body for non-trivial changes |
| No blank line between subject/body | Add blank line |

## Automation Guidelines

When generating commit messages programmatically (with AI or scripts):

**Prompt template:**
```
Create a commit message following these rules:
1. Subject: max 50 chars, imperative mood, capitalize, no period
2. Test: "If applied, this commit will [subject]" must read correctly
3. Blank line separates subject from body
4. Body: wrap at 72 chars, explain what and why (not how)
5. Body required unless change is trivial

Format:
<Subject line>

<Body paragraph 1>

<Body paragraph 2 if needed>
```

**Verification checklist:**
- [ ] Subject ≤50 chars (or ≤72 if absolutely necessary)
- [ ] Subject uses imperative mood
- [ ] Subject capitalized, no period
- [ ] Blank line after subject (if body exists)
- [ ] Body wrapped at 72 chars
- [ ] Body explains what and why

## Common Rationalizations (STOP These)

| Excuse | Reality |
|--------|---------|
| "It's urgent, no time for proper message" | Good commit message takes 30 seconds. Bad message wastes hours of future debugging time. |
| "Lead said commit messages don't matter" | History is permanent. Unclear messages waste developer time forever. Write it properly. |
| "I already wrote this longer subject line" | Delete it. Rewrite under 50 chars. Sunk cost doesn't justify breaking the rule. |
| "It's just WIP/local/temporary" | WIP commits often become permanent. Local branches get pushed. Write it right the first time. |
| "I'll fix it later with --amend" | You won't. Write it correctly now. Takes the same time. |
| "No one will read this anyway" | Someone will read it when debugging. That someone might be you in 6 months. |
| "This is just experimental code" | Experiments get committed. Documentation matters even more for experimental work. |

**If you're thinking any of these thoughts:** STOP. Follow the seven rules. No exceptions.

## Source

Based on: https://cbea.ms/git-commit/
