# Solstice Events Co. Check-in Kiosk Service

## Overview
This is an asynchronous event check-in kiosk service for Solstice Events Co.'s multi-day tech conference. When staff scan an attendee's QR code, the system queues a badge print job and displays a "pending" state until the printer confirms completion via webhook.

## Architecture
- **Message Queue:** Upstash Redis (for print job queue + state storage)
- **Endpoints:**
  - `/api/checkin` - Receives QR scans, prevents duplicates, queues print jobs
  - `/api/webhook` - Receives printer callbacks, updates attendee status
  - `/api/status` - Returns current attendee status for kiosk UI
- **Deployment:** Vercel serverless functions

## Key Features
- Duplicate scan protection (no second badge for same attendee)
- Out-of-order confirmation handling (timestamp-based)
- Async state machine (not_checked_in → pending → checked_in)
- 3 test attendees: Alice (ATT001), Bob (ATT002), Charlie (ATT003)

## Pivot Context
This project represents a Day 4 pivot from a synchronous polling model to an asynchronous message queue + webhook model. The previous Northstar Retail inventory API is archived in a separate repository.

## Blocker Journal
All learning challenges, errors, and resolutions are documented in `BLOCKER_JOURNAL.md`.

