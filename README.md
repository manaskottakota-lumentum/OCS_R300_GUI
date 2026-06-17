# OCS R300 GUI

Interactive React dashboard prototype for managing an OCS R300 optical circuit switch.

## Run

Install dependencies and run the Vite dev server:

```powershell
pnpm install
pnpm dev
```

Then open the local URL printed by Vite, usually `http://127.0.0.1:5173`.

Build the production bundle:

```powershell
pnpm build
```

## Current Status

- React/Vite single-page dashboard prototype
- Simulated Live and Draft Plan modes
- Simulated OCS R300 A/B cross-connect matrix
- Mock validation, dry run, apply, rollback, profiles, audit, telemetry, and provisioning workflows

## Next Step

Convert the prototype into a real dashboard application with a backend service:

```text
Browser UI -> backend API / WebSocket -> gNMI / gNOI client -> OCS R300 management IP
```

The browser should not hold switch credentials, client certificates, or private keys directly.

## Frontend Stack

- React
- Vite
- pnpm
- Tailwind CSS via CDN for the current prototype styling
- lucide-react SVG icons
