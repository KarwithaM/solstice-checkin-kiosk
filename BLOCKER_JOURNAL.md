# Learning & Blocker Journal: Solstice Events Kiosk (Day 4 Pivot)
**Learner:** Sheila Mbae
**Date:** 20 AUG 2026 - 23 AUG 2026  
**Phase:** Day 4 Pivot - Async Architecture  
**Context:** Pivoted from Northstar Retail inventory sync to Solstice Events check-in kiosk

---------------------------------------------------------------------------------------------------

## Log Entry 01: Repository Setup & Pivot Context

**Task:** Create a new repository for the Solstice Events pivot and establish the project foundation.

**Challenge / Blocker:** 
I had to decide whether to continue in the existing Northstar repo or start fresh. 
The client, use case, and architecture all changed dramatically.

**Resources Consulted:** 
- Course assignment guide (Day 4 pivot requirements)
- Real-world software engineering practices (project separation)

**Decision & Resolution:** 
I chose to create a new repository (`solstice-checkin-kiosk`) rather than continuing in the Northstar repo. 
This provides clean separation between two different clients and makes the Scope Delta Analysis clearer. 
The old Northstar repo serves as the "before pivot" baseline, and this new repo represents the "after pivot" implementation.

**Time Breakdown:**
- Decision-making and planning: 10 mins
- Creating new repo: 3 mins
- Writing README: 5 mins
- Initializing blocker journal: 5 mins
- Buffer: 2 mins

---------------------------------------------------------------------------------------------------

## Log Entry 02: Vercel Environment Variables Setup

**Task:** Configure Upstash Redis credentials as environment variables in Vercel for secure access from serverless functions.

**Challenge / Blocker:** 
I initially didn't understand that environment variables require a redeployment to take effect. 
I added them but my code still couldn't access them until I redeployed.

**Resources Consulted:** 
- Vercel Docs: Environment Variables (https://vercel.com/docs/concepts/projects/environment-variables)
- Upstash Docs: Getting REST API credentials (https://upstash.com/docs/redis/overall/getstarted)

**Decision & Resolution:** 
I added two environment variables (UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN) in Vercel's Settings → Environment Variables section. 
I selected one environments (Production and Preview) to ensure consistency. 
After adding them, I redeployed the project via the Deployments tab. 
I verified the setup by creating a temporary test endpoint that confirmed both variables were accessible via process.env.

**Security Note:** 
I never committed the actual credentials to GitHub. 
The .env.example file serves as documentation for what variables are needed, but the real values live only in Vercel's secure environment.

**Time Breakdown:**
- Navigating Vercel UI: 3 mins
- Copying credentials from Upstash: 5 mins
- Adding both variables: 5 mins
- Redeploying: 2 mins
- Creating test endpoint to verify: 5 mins
- Journaling: 5 mins
- Buffer: 5 mins

----------------------------------------------------------------------------------------------------

## Log Entry 03: Vercel 404 Deployment Not Found

**Task:** Verify that environment variables are correctly injected into the Vercel serverless function via a test endpoint.

**Challenge / Blocker:** 
When visiting the test endpoint URL (https://solstice-checkin-kiosk-project.vercel.app/api/test-env), I received a `404: Deployment not found` error. 

**Resources Consulted:** 
- Vercel Dashboard UI to locate the exact auto-generated project URL.
- GitHub repository file tree to verify file existence.

**Decision & Resolution:** 
I realized I had manually typed a guessed URL (`solstice-checkin-kiosk-project.vercel.app`) instead of using the actual auto-generated URL provided by Vercel (`solstice-checkin-kiosk.vercel.app`). 
I navigated to the Vercel dashboard, copied the exact "Visit" URL, appended `/api/test-env`, and the endpoint successfully returned the masked environment variables, proving they were securely injected.

**Time Breakdown:**
- Troubleshooting the 404: 15 mins
- Verifying GitHub file structure: 3 mins
- Testing correct URL: 2 mins
- Journaling: 5 mins

---------------------------------------------------------------------------------------------------

## Log Entry 04: Check-in Endpoint with Duplicate Protection

**Task:** Build the /api/checkin endpoint that handles QR scans, prevents duplicate badges, and queues print jobs asynchronously.

**Challenge / Blocker:** 
I had to figure out how to call Upstash Redis from a Vercel serverless function without installing a heavy SDK. 
I also needed to decide WHERE to store the "source of truth" for attendee status — the static JSON file or the live Redis database.

**Resources Consulted:** 
- Upstash Docs: REST API Reference (https://upstash.com/docs/redis/api/rest/getstarted)
- Redis Docs: LPUSH command (https://redis.io/commands/lpush/)
- HTTP Status Codes: 409 Conflict (https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/409)

**Decision & Resolution:** 
I built a custom REST helper (lib/redis.js) that encodes Redis commands in the URL path, which is how Upstash's REST API works. 
I made Redis the source of truth for attendee status because the JSON file is static and can't handle real-time state changes. 
For duplicate protection, I check the Redis status BEFORE queuing a new job, and return a 409 Conflict if the attendee is already checked in. 
I used LPUSH to add jobs to the queue (FIFO order) and SET to store status + timestamp.]

**Time Breakdown:**
- Building redis.js helper: 20 mins
- Writing checkin.js logic: 30 mins
- Committing and verifying structure: 10 mins
- Journaling: 10 mins
- Buffer: 5 mins

---------------------------------------------------------------------------------------------------

## Log Entry 05: Webhook Endpoint with Out-of-Order Protection

**Task:** Build the /api/webhook endpoint that receives printer callbacks and updates attendee status, handling out-of-order confirmations.

**Challenge / Blocker:** 
The pivot requirement mentioned "confirmations may arrive out of order." 
I had to figure out how to prevent an old confirmation from overwriting a newer status. 
This is a classic distributed systems problem called "eventual consistency."

**Resources Consulted:** 
- Redis Docs: SET command (https://redis.io/commands/set/)
- JavaScript Date parsing for timestamp comparison
- System Design: Handling out-of-order events in distributed systems (https://redis.io/commands/set/)

**Decision & Resolution:** 
I implemented a timestamp-based comparison. 
Each status update stores a timestamp in Redis. 
When a new webhook arrives, I compare its timestamp to the stored one. 
If the incoming confirmation is older, I ignore it and return a 200 OK (so the printer doesn't retry). 
This ensures the most recent state always wins, even if confirmations arrive out of order. 
I also added validation to ensure the webhook payload includes the required fields.

**Time Breakdown:**
- Writing webhook.js logic: 35 mins
- Designing timestamp comparison: 20 mins
- Testing edge cases mentally: 15 mins
- Journaling: 10 mins
- Buffer: 5 mins

----------------------------------------------------------------------------------------------------

## Log Entry 06: Status Endpoint for Kiosk UI

**Task:** Build the /api/status endpoint that returns the current check-in state for any attendee, allowing the kiosk UI to display "Pending..." or "Checked In".

**Challenge / Blocker:** 
I needed to decide whether to return a default status (like "not_checked_in") when Redis has no data yet, or return null. 
I also had to handle the case where the attendee exists in the JSON file but has never been scanned.]

**Resources Consulted:** 
- Redis Docs: GET command (https://redis.io/commands/get/)
- Express.js response patterns for optional fields

**Decision & Resolution:** 
I chose to return "not_checked_in" as the default status when Redis returns null, because this gives the UI a clear state to work with. 
I also return the jobId (if it exists) so the UI can display which print job is pending. 
The endpoint reads from both the static attendees.json (for name/QR mapping) and Redis (for live status), demonstrating a hybrid data source pattern.]

**Time Breakdown:**
- Writing status.js logic: 30 mins
- Testing default value handling: 15 mins
- Journaling: 10 mins
- Buffer: 5 mins

---------------------------------------------------------------------------------------------------

## Log Entry 07: End-to-End Debugging Session - From 500 Errors to Success

**Task:** Execute the /api/checkin endpoint and achieve successful check-in with duplicate protection and Redis queue integration.

**Challenge / Blocker:** 
This was an extensive, multi-hour debugging session that involved resolving SEVEN distinct blockers in sequence:

1. **Missing attendees.json file** - The function crashed with FUNCTION_INVOCATION_FAILED because the static attendee data file was never committed to GitHub.

2. **Missing Environment Variables** - After adding attendees.json, received 500 Internal Server Error. Vercel logs showed "Failed to parse URL from undefined" - the UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN were not set in Vercel.

3. **Environment Variables Not Injected** - After adding env vars, still got errors. Learned that Vercel only injects environment variables at BUILD time, requiring a full redeploy (not just a refresh).

4. **Missing HTTP POST Method** - After env vars were confirmed working, still got 500 errors. Discovered Upstash REST API requires ALL requests to use POST method, even for Redis GET commands. My lib/redis.js was missing `method: 'POST'` in the fetch options.

5. **WRONGPASS Authentication Error** - After fixing POST method, received `{"error":"WRONGPASS invalid or missing auth token"}`. The token in Vercel had hidden whitespace or was incorrectly copied.

6. **Token Validation** - Used direct curl testing to verify the token worked: `curl https://UPSTASH_URL/PING -H "Authorization: Bearer TOKEN" -X POST` returned PONG, confirming the token was valid but Vercel config was wrong.

7. **Final Redeploy** - After regenerating and correctly pasting the token (no spaces!), triggered a fresh Vercel redeploy.

**Resources Consulted:** 
- Vercel Docs: Environment Variables (https://vercel.com/docs/concepts/projects/environment-variables)
- Vercel Docs: Function Debugging (https://vercel.com/docs/functions/debugging)
- Upstash Docs: REST API Authentication (https://upstash.com/docs/redis/api/rest/getstarted)
- Upstash Docs: Troubleshooting WRONGPASS (https://upstash.com/docs/redis/troubleshooting/http_unauthorized)
- MDN Web Docs: Fetch API method property (https://developer.mozilla.org/en-US/docs/Web/API/Request/method)
- Node.js process.env documentation

**Decision & Resolution:** 
I systematically debugged each layer of the stack:
1. First verified file structure (attendees.json exists in GitHub)
2. Then verified environment variables (added to Vercel, triggered redeploy)
3. Then verified HTTP method (added method: 'POST' to lib/redis.js)
4. Then verified authentication (used direct curl PING test to isolate token validity)
5. Finally achieved success with proper token and redeploy

The final working curl command returned:
{
  "success":true,
  "message":"Print job queued for Alice Johnson",
  "status":"pending",
  "jobId":"job_1787487120702_ATT001",
  "note":"Screen should show 'Pending...' until webhook confirmation arrives"
}

This proves the async check-in workflow is functioning: QR scan → duplicate check → Redis queue → pending status.

**Key Insights:** 
1. **Environment variables require redeploy** - Vercel injects env vars at build time, not runtime. Always redeploy after changing them.
2. **API provider quirks matter** - Upstash requires POST for ALL requests, even GET commands. Never assume HTTP method based on operation name.
3. **Test incrementally** - Used test-env endpoint to verify env vars, used curl PING to verify token. Isolate each layer.
4. **Whitespace kills** - Hidden spaces in copied tokens cause authentication failures. Use copy buttons, not manual selection.
5. **Read the logs** - Vercel Functions tab shows exact error messages. The "WRONGPASS" error told us exactly what was wrong.
6. **Persistence pays** - Seven blockers in a row could have been discouraging, but each one taught something valuable about serverless architecture.

**Time Investment:**
- Missing attendees.json: 5 mins
- Environment variables setup: 25 mins
- POST method fix: 10 mins
- Token authentication debugging: 40 mins
- Testing and verification: 15 mins
- Journaling: 15 mins
- **Total: ~110 minutes of intensive debugging**

**Test 1 Status: COMPLETE**
- Endpoint: POST /api/checkin
- Input: {"qrCode": "ATT001"}
- Output: 202 Accepted with pending status
- Screenshot: Captured in terminal
