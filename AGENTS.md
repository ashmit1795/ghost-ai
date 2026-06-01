<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Before writing any code, list the files in `node_modules/next/dist/docs/`, read the guide most relevant to the current task, and heed deprecation notices. If that directory is missing or inaccessible, pause and ask the user for the correct path.

<!-- END:nextjs-agent-rules -->

## Application Building Context

Read the following files in order before implementing or making any architectural decision:

1. `context/project-overview.md` — product definition, goals, features, and scope
2. `context/architecture-context.md` — system structure, boundaries, storage model, and invariants
3. `context/ui-context.md` — theme, colors, typography, canvas design, and component conventions
4. `context/code-standards.md` — implementation rules and conventions
5. `context/ai-workflow-rules.md` — development workflow, scoping rules, and delivery approach
6. `context/progress-tracker.md` — current phase, completed work, open questions, and next steps

Update `context/progress-tracker.md` after completing a distinct feature, component, API endpoint, or discrete task outlined in the progress tracker.

If implementation changes the architecture, scope, or standards documented in the context files, update the relevant file before continuing.