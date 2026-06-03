## Goal

Build the `/editor` home screen and add project dialogs/sidebar actions. No API calls or persistence yet.

## Editor Home

Integrate the workspace sidebar behavior including owned/shared project separation, workspaces list loading, sidebar actions, and closing the sidebar on backdrop tap/click outside.

In the center of the page, add:

- heading: `Design your next system architecture`
- description: `Start a new design sandbox, or choose a workspace from the sidebar to begin collaborative modeling.`
- `Initialize Workspace` button with a `Plus` icon

Keep the layout minimal. Do not wrap this content in cards.

Clicking `Initialize Workspace` should open the Initialize Workspace dialog.

## Dialogs

### Initialize Workspace / Create Workspace

- workspace name input
- live slug preview based on the name
- preview updates as the user types

### Rename Workspace

- prefilled workspace name input
- current workspace name shown in the description
- input auto-focuses
- Enter submits

### Deprovision Workspace

- destructive confirmation only
- no input
- confirm button uses destructive styling

## Sidebar

Add workspace item actions:

- rename
- deprovision

Show actions only for owned workspaces.

Hide actions for shared/collaborator workspaces.

On mobile:
- tapping outside the sidebar closes it
- add a backdrop scrim

## Implementation

Create a dedicated hook to manage:

- dialog state
- form state
- loading state

Wire:

- editor home `Initialize Workspace` ➔ Initialize Workspace dialog
- sidebar create ➔ Initialize Workspace dialog
- sidebar rename ➔ Rename Workspace dialog
- sidebar deprovision ➔ Deprovision Workspace dialog

Use mock workspace data only. Do not add API calls or persistence.

## Check When Done

- sidebar actions are wired
- slug preview works
- no TypeScript errors
- no lint errors