# Cadence — Vision

## The Problem

Knowledge workers and managers carry dozens of parallel conversations — 1:1s with direct reports, meetings with stakeholders, alignment sessions with other teams. In each of these contexts, there are open topics: commitments that need to be honored, decisions that are pending, things that are being waited on.

Today, these topics live scattered: in note-taking apps, in email drafts, on post-its, in people's heads. The result: you walk into a meeting and forget half of it. You're waiting for a deliverable and only realize weeks later that nothing arrived. You promised someone something and remember too late.

Existing tools don't solve this problem:

- **To-do apps** (Todoist, Things) are task-centric, not context-centric. They answer "What do I need to do?" — but not "What do I need to discuss with Max?"
- **Note-taking apps** (Obsidian, Notion) are too open-ended. You can build anything, but nothing enforces structure. This leads to systems you have to maintain before you can even use them.
- **Project management tools** (Jira, Asana) are built for teams, not for personal conversation management. They are too heavyweight for "I need to follow up with Lisa next week."

## The Solution

Cadence is a personal, context-based topic tracking tool. It organizes topics not by projects or deadlines, but by the people and situations in which they become relevant.

**The core workflow:**
1. A topic comes to mind → Quick Capture, 2 seconds, done.
2. You're heading into a meeting / 1:1 → You open the context and immediately see: What do I need to bring up? What do I need to deliver? What am I waiting on?
3. During the conversation → You make quick updates directly on the topic.
4. After the conversation → Topic completed, or scheduled for follow-up next time.

## Design Principles

### 1. Speed over Completeness

Better to capture a topic with just a title than not at all because the form has too many fields. The inbox catches everything. Tidying up can happen later.

### 2. Context is King

The primary navigation is the context, not the task. "I'm with Max right now" → everything relevant appears. The tool thinks in conversations, not in task lists.

### 3. Direction Matters

Every topic has a direction: Am I bringing something up, am I delivering something, or am I waiting? This three-way split structures every conversation and immediately makes clear who is up next.

### 4. Progressive Disclosure

The topic list shows the minimum: title, priority, status. Details open on the right. Updates are chronological and scannable. No scrolling through walls of text.

### 5. Filesystem First

Data belongs to the user, not the app. Markdown files with frontmatter are the format — readable without the tool, versionable with Git, syncable with any cloud service, compatible with Obsidian.

### 6. No Babysitting

The tool requires no constant maintenance. It runs on the desktop, shows what's pending when opened, and doesn't intrude when not needed. No push notifications, no gamification, no streaks.

## Target Audience

Primary: Managers and senior engineers with 3-15 direct communication partners who hold regular 1:1s and meetings.

Secondary: Any knowledge worker who wants to track topics by context — project leads, consultants, sales professionals.

**Not the target audience:** Teams that need shared task management. Cadence is a personal tool, not a collaboration tool.

## Differentiation

| Aspect | Cadence | To-Do App | Note-Taking App | Project Tool |
|--------|-------------|-----------|-----------|-------------|
| Organized by | Context (Person/Meeting) | Project/List | Freeform | Project/Sprint |
| Core question | "What do I discuss with X?" | "What do I need to do?" | "What did I note down?" | "Who does what by when?" |
| Capture speed | < 2 seconds | ~5 seconds | ~10 seconds | ~30 seconds |
| Data format | Markdown (open) | Proprietary | Markdown (partial) | Proprietary |
| Collaboration | No (personal) | Partial | Partial | Yes |
| Learning curve | Minimal | Low | High | High |

## Success Criteria

Cadence is successful when:

1. **Quick Capture works.** From thought to captured topic takes less than 3 seconds. No reason to ever say "I'll just remember that."

2. **Meetings become more productive.** You walk in prepared (all topics at a glance), miss nothing (follow-ups are visible), and forget no follow-through (follow-up scheduling).

3. **Nothing falls through the cracks.** Topics where you're waiting on someone become visible — with wait time. "Waiting for 14 days" is a clear signal to follow up.

4. **The data outlives the tool.** If Cadence ceases to exist tomorrow, the user has a folder of readable Markdown files that contain everything.

## Long-Term Vision

Phases 1-3 are the foundation. Beyond that, there are directions that are deliberately not yet planned but conceivable:

- **Statistics:** "How many topics have I resolved with Lisa in the last 30 days?" — insight into your own conversation efficiency.
- **Templates:** Predefined topic sets for specific meeting types (sprint retro questions, 1:1 standard items).
- **Calendar integration:** Automatically open the right context when a meeting starts in the calendar. Deliberately not in phases 1-3 because it introduces complexity that contradicts the "No Babysitting" principle.
- **Mobile companion:** Lightweight mobile app for read-only + Quick Capture. Until then: Obsidian Mobile as a bridge.

These directions will only be pursued if they don't dilute the core principles.
