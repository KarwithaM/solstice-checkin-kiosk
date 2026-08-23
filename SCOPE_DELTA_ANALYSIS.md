# Scope Delta Analysis: Solstice Events Co. Pivot

**Date:** August 23, 2026  
**Author:** Sheila  Mbae
**Project:** Solstice Events Check-in Kiosk  
**Pivot Trigger:** Client requirement change from a synchronous 5-minute polling model to an asynchronous message queue + webhook push model.

---

## 1. Executive Summary
The original specification required a polling-based inventory system for Northstar Retail Co. However, the Day 4 pivot introduced a completely new client (Solstice Events Co.) and a fundamentally different architectural paradigm: an asynchronous event check-in kiosk. This document outlines the specific components dropped, modified, and added to meet the new requirement of real-time, duplicate-safe badge printing with out-of-order webhook handling.

## 2. What Was Dropped 
The following components from the Day 3 "Original Build" were entirely deprecated and removed, as they are incompatible with an asynchronous, event-driven architecture:
- **`scripts/poll-warehouse.js`**: The simulated 5-minute cron job polling mechanism is no longer needed.
- **`warehouse-source.json` & `cache.json`**: Local file-based caching was abandoned. Serverless environments (like Vercel) have read-only filesystems at runtime, making local file writes unreliable for persistent state.
- **Synchronous Waiting Logic**: The UI can no longer block and wait for an immediate "print success" response.

## 3. What Was Modified 
- **State Management Paradigm**: Shifted from a simple "read local file" approach to a distributed state machine (`not_checked_in` → `pending` → `checked_in`). 
- **Data Persistence Strategy**: Moved from simulated local JSON files to an external, cloud-native key-value store (Upstash Redis) accessed via REST API. This ensures state persists across multiple serverless function invocations.
- **Project Context**: The entire codebase was migrated to a new repository (`solstice-checkin-kiosk`) to maintain clean separation of concerns between the deprecated Northstar project and the new Solstice project.

## 4. What Was Added 
To fulfill the new async requirements, the following components were built from scratch:
- **Upstash Redis Integration**: A cloud message queue and state store. A custom REST helper (`lib/redis.js`) was built to handle authentication, HTTP POST requirements, and response unwrapping.
- **`/api/checkin` Endpoint**: Handles incoming QR scans. It now includes robust **duplicate scan protection** (returning a `409 Conflict` if the attendee is already `pending` or `checked_in`) and pushes print jobs to the Redis queue.
- **`/api/webhook` Endpoint**: Receives asynchronous callbacks from the badge printer. It includes **out-of-order confirmation protection** by comparing incoming timestamps against the stored Redis timestamp, ignoring older, delayed messages to prevent state regression.
- **`/api/status` Endpoint**: Allows the kiosk UI to poll the current state of an attendee (`pending` vs. `checked_in`) without blocking the initial check-in request.
- **Comprehensive Blocker Journal**: 18 detailed log entries documenting the troubleshooting journey, including resolving environment variable injection, HTTP method mismatches, authentication token validation, and JavaScript type mismatches in API responses.

## 5. Trade-offs & Architectural Integrity 
- **Trade-off (Complexity vs. Reliability)**: The async model is inherently more complex to debug than a synchronous poll (as evidenced by the multi-step debugging of Redis response types and auth tokens). However, it is vastly more scalable and provides a better user experience, as the kiosk UI never freezes waiting for a printer.
- **Trade-off (Local vs. External State)**: We sacrificed the simplicity of local JSON files for the robustness of an external database (Upstash). This was a non-negotiable requirement for serverless functions to maintain state between the `/api/checkin` and `/api/webhook` invocations.
- **Integrity Check**: The system successfully enforces all core business rules:
  1. A scanned QR code queues a job and returns `202 Accepted` immediately.
  2. A duplicate scan of the same QR code is rejected with `409 Conflict`.
  3. A webhook callback successfully transitions the state to `checked_in`.
  4. An out-of-order (delayed) webhook is safely ignored, preserving data integrity.

## 6. Conclusion
The pivot was successfully executed within the time-box. By embracing the asynchronous paradigm and leveraging Upstash Redis, the new architecture is not only compliant with the client's new requirements but is also more resilient, scalable, and production-ready than the original polling specification.
