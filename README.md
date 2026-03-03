# IITC-Plugin

Collection of IITC userscripts for Recon planning workflows.

## Contents

1. `wayfarer-planner.user.js` (UI name: **Recon Planner**)
2. `Recon-Range.user.js` (UI name: **Recon Range**)

## Requirements

- IITC-CE running on:
  - `https://intel.ingress.com/*`
  - `https://intel-x.ingress.com/*` (for `Recon-Range.user.js`)
- A userscript manager (Tampermonkey / Violentmonkey / Greasemonkey)
- Optional: IITC Draw Tools plugin (for `Recon-Range.user.js` marker circles)

## Install

1. Open your userscript manager dashboard.
2. Create a new script.
3. Copy one of the files in this repository and paste it.
4. Save and reload IITC.

## Plugin: Recon Planner (`wayfarer-planner.user.js`)

### What it does

- Loads candidate markers from a configurable `scriptURL`.
- Draws markers in status-based layers.
- Supports creating, editing (including drag), and deleting candidates.
- Can show:
  - Title labels
  - 20m submit radius
  - 40m interaction radius
  - Voting proximity S2 cells
- Supports per-status color/radius toggles and map visual customization.

### Data source contract

`GET scriptURL` should return a JSON array of candidates.

Example candidate object:

```json
{
  "id": "abc123",
  "title": "Portal Name",
  "description": "Optional text",
  "lat": 31.2304,
  "lng": 121.4737,
  "status": "potential",
  "nickname": "agent",
  "submitteddate": "2026-03-03",
  "candidateimageurl": "https://.../photo"
}
```

`POST scriptURL` receives form data from the popup form:

- Create/update: full form submission
- Delete: `status=delete` and `id=<candidate_id>`

The backend is expected to return the saved candidate JSON for create/update.

### Storage

- Current settings key: `recon_planner_settings`
- Legacy key still read for migration: `wayfarer_planner_settings`

## Plugin: Recon Range (`Recon-Range.user.js`)

### What it does

- Adds a toggleable IITC layer named `Recon Range`.
- Draws an outline-only 20m circle around visible portals.
- Integrates with Draw Tools markers and keeps marker circles synced on:
  - Create
  - Drag/edit
  - Delete/clear/import/snap
- Auto-hides circles below zoom level 16.

## Notes

- Both scripts rely on IITC internals and DOM structure. If IITC APIs change, updates may be required.
- If layer entries exist but nothing is drawn, check zoom level and plugin toggles first.

