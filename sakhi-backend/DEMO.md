# Hackathon Demo Rehearsal Script

**Time Allocation:** 45 Seconds
**Goal:** Prove the offline-sync and real-time alerting backend works flawlessly.

---

### Step 1: Introduction
**[Action]** Bring up the backend terminal or code editor.
**[Script]** *"This is our FastAPI backend. All ASHA data lands here."*

### Step 2: Simulate Offline Sync
**[Action]** Open your browser to `http://localhost:8000/docs` (Swagger UI).
**[Action]** Click the **"Authorize"** button and log in with the ASHA credentials (`9999999999` / `1234`).
**[Action]** Expand the `POST /api/v1/sync` endpoint and click **"Try it out"**.

### Step 3: Insert High-Risk Payload
**[Action]** Paste the following JSON into the request body:
*(Note: I replaced `...` with a valid UUID so SQLAlchemy doesn't throw a validation error live on stage)*
```json
{
  "visits": [
    {
      "client_id": "test-demo-1",
      "patient_id": "00000000-0000-0000-0000-000000000000",
      "bp_sys": 150,
      "risk_level": "high",
      "device_ts": "2026-05-02T10:00:00Z"
    }
  ]
}
```

### Step 4: Execute & Show Response
**[Action]** Click **"Execute"**.
**[Script]** Point to the green `200` response body showing:
```json
{
  "saved": 1,
  "failed": [],
  "server_ts": "..."
}
```

### Step 5: Show Real-time Alerting
**[Action]** Open a new browser tab to `http://localhost:8000/docs`.
**[Action]** Click **"Authorize"** and log in with the ANM/PHC credentials (`7777777777` / `1234`).
**[Action]** Expand the `GET /api/v1/alerts/phc` endpoint and click **"Execute"**.
**[Script]** Point to the response showing the alert: `"High risk: test-demo-1"`.

### Step 6: The Hook
**[Script]** *"So when an ASHA hits sync in the village, the PHC sees the alert instantly."*

### Step 7: Database Verification
**[Action]** Open your SQLite/Postgres terminal viewer.
**[Action]** Run the following SQL query:
```sql
SELECT risk_level, count(*) FROM visits GROUP BY risk_level;
```
**[Script]** *"And the data is immediately aggregated in our core database for wider stats and analytics."*

---
**[End of Demo Segment]**
