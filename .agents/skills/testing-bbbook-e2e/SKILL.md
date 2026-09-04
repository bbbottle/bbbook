---
name: testing-bbbook-e2e
description: Run local bbbook browser E2E flows without a physical Kindle by providing a deterministic SSH-backed Kindle filesystem and validating auth, library, settings, and session behavior.
---

# Testing bbbook E2E locally

## Devin Secrets Needed

None. Use the repository blueprint's local-only authentication values.

## Services and state

- Use the blueprint's `start-api`, `start-web`, and `reset-local-db` commands.
- A clean database is required to exercise password login and first-time TOTP setup. Save the displayed TOTP secret during the run so logout/re-login can use a fresh code.
- Keep the disposable book fixture outside the checkout and delete it through the UI before finishing.

## Deterministic Kindle transport

When no physical Kindle is available, prepend a temporary directory containing an executable named `ssh` to the API process `PATH`. The shim should accept `ssh -G`, translate `/mnt/us` to a temporary drive, return deterministic device values, and record `appmgrd start` commands. The SDK resource throttler runs `free -m` before queued operations, so that command must be handled reliably.

## Cold-start Device Info check

Keep the first Device Info request and a later retry as separate assertions. If the first visit says `Device unavailable` while the background snapshot is filling and a retry later succeeds, report the first visit as a failure rather than masking it. Shim timestamps distinguish the empty-snapshot race from an SSH command failure.

The web app uses a `MemoryRouter` initialized to `/library`, so loading `/settings/device` in the browser address bar does not directly render Device Info. Use the native top-right menu → Settings → Device Info path. AppLayout starts the shared Device Info fetch on mount; browser automation may take longer than its retry window to traverse those three actions. Inspect same-origin `/kindle/info` resource timings before the 60-second navbar revalidation to prove automatic startup retries independently of UI-action latency. When testing terminal failures, checkpoint AppLayout's automatic request sequence after the full retry window but before navigating to Device Info: rejected promises are removed from `useCached`, so mounting Device Info can make a separate request that must not be misclassified as an automatic retry.

## Browser evidence

- Install `error` and `unhandledrejection` collectors before the flow.
- Count any mutation where route `<main>` exists without the persistent `<nav>` shell while visiting lazy routes.
- Confirm the e-ink canvas stays mounted and the status clock advances across a real minute boundary.
- Record UI interactions; use shell evidence only for fake-Kindle commands and service health.
