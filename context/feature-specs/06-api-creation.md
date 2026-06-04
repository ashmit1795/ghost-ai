The database schema is ready. Build the backend project API routes only.

## Routes

Create REST endpoints for:

- `GET /api/projects` , list current user’s projects
- `POST /api/projects` , create project
- `PATCH /api/projects/[projectId]` , update project name and/or description
- `DELETE /api/projects/[projectId]` , delete project

## Rules

Use the authenticated Clerk user ID as `ownerId`.

When creating:

- default missing project name to `Untitled Project`
- use the schema’s existing ID strategy, do not add sequential IDs

When updating:

- accept optional name and description fields, and update those attributes accordingly

Security:

- unauthenticated requests return `401`
- only the project owner can update or delete
- non-owner mutations return `403`

Keep this backend-only. Do not wire the UI yet.


## Check When Done

- routes exist for list/create/update/delete
- owner checks are enforced for update/delete
- `401` and `403` responses are handled correctly
- `npm run build` passes