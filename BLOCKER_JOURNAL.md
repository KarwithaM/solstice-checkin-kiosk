# Learning & Blocker Journal: Solstice Events Kiosk (Day 4 Pivot)
**Learner:** Sheila Mbae
**Date:** 20 AUG 2026 - 23 AUG 2026  
**Phase:** Day 4 Pivot - Async Architecture  
**Context:** Pivoted from Northstar Retail inventory sync to Solstice Events check-in kiosk

---

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
