# PatternCraft

PatternCraft is a Vite + React + TypeScript app that turns reference photos of a 3D object into editable 2D pattern pieces. Users can upload multiple images, provide optional dimensions and material context, then review and export a tiled PDF pattern in the browser.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Framer Motion
- TanStack Query
- Supabase Edge Functions
- Lovable AI Gateway for vision/model generation
- Vitest + Testing Library

## Local Development

### Prerequisites

- Node.js 20+
- npm
- Supabase CLI if you want to run the edge function locally

### Install

```bash
npm install
```

### Run the app

```bash
npm run dev
```

The Vite dev server runs on `http://localhost:8080`.

## Environment Variables

Create a local `.env` file with:

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-publishable-anon-key>
```

The edge function also expects:

```bash
LOVABLE_API_KEY=<server-side-secret>
```

## Running the Edge Function Locally

Serve Supabase locally:

```bash
supabase start
supabase functions serve generate-pattern --env-file .env
```

The frontend posts to:

`{VITE_SUPABASE_URL}/functions/v1/generate-pattern`

## Reliability Notes

- The frontend validates generated pattern data before sending users into the editor.
- The editor can recover the last valid generated pattern from local storage after a refresh.
- If `VITE_SUPABASE_URL` or `VITE_SUPABASE_PUBLISHABLE_KEY` is missing, the app falls back to a demo pattern so the editor experience stays explorable.
- The edge function returns structured error categories such as `invalid_request`, `response_parse_error`, and `invalid_model_output`.

## Quality Checks

```bash
npm run lint
npm run test
npm run build
```

## Known Limitations

- AI-generated pattern geometry is still approximate and should be reviewed before production use.
- PDF tiling is browser-side and depends on the current SVG preview state.
- The app currently stores only the most recent valid pattern locally; it does not keep a full project history.
