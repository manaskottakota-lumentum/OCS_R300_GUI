# OCS R300 GUI

Interactive dashboard prototype for managing an OCS R300 optical circuit switch.

## Run

Open `index.html` in a browser. The current implementation is self-contained and uses CDN-hosted Tailwind CSS and Tabler Icons.

## Current Status

- Static single-page dashboard prototype
- Simulated Live and Draft Plan modes
- Simulated OCS R300 A/B cross-connect matrix
- Mock validation, dry run, apply, rollback, profiles, audit, telemetry, and provisioning workflows

## Next Step

Convert the prototype into a real dashboard application with a backend service:

```text
Browser UI -> backend API / WebSocket -> gNMI / gNOI client -> OCS R300 management IP
```

The browser should not hold switch credentials, client certificates, or private keys directly.
