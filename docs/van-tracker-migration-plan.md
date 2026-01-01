# Plan: Switch from Phone GPS to Van Tracker-Based Location

## Summary
Replace browser geolocation (volunteer's phone) with dedicated van GPS tracker for location tracking. This enables automatic session management and removes dependency on volunteers keeping the app open.

## Key Changes

### 1. Database Schema (New Migration)

**Create `van` table:**
```sql
CREATE TABLE van (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    -- NOTE: Fixed route assignment for now. May change to dynamic assignment later - check with president.
    route_id UUID REFERENCES route(id) ON DELETE SET NULL,
    tracker_device_id VARCHAR(255) UNIQUE,  -- External tracker ID
    tracker_type VARCHAR(50) DEFAULT 'generic',  -- For future provider flexibility
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Modify `distribution_session`:** Add `van_id UUID REFERENCES van(id)`

**Modify `van_location`:** Add `van_id UUID REFERENCES van(id)` (optional, for direct lookup)

**Files:**
- `src/db/schema.ts` - Add van table, update relations
- Create new migration via `npx drizzle-kit generate`

---

### 2. Tracker Abstraction Layer (New Files)

Create flexible interface for unknown tracker type:

```
src/lib/trackers/
├── types.ts           # TrackerLocation, TrackerProvider interfaces
├── index.ts           # Provider registry
├── processor.ts       # processVanLocation() - stop detection, session management
└── providers/
    └── generic.ts     # Placeholder provider (customize when tracker chosen)
```

**Key function - `processVanLocation(vanId, routeId, location)`:**
1. Record location to `van_location` table
2. Get or auto-create active session for van
3. Detect current stop via 350m proximity
4. Update session's `current_stop_id`

---

### 3. Webhook API Endpoint (New File)

**File:** `src/app/api/tracker/webhook/route.ts`

```typescript
POST /api/tracker/webhook?device_id=XXX
```

- Receives location data from tracker
- Looks up van by `tracker_device_id`
- Parses location via appropriate provider
- Calls `processVanLocation()`

---

### 4. Refactor Client-Side Hooks

**`src/hooks/distribution/useLocation.ts`**
- Remove `navigator.geolocation.watchPosition()`
- Keep `getDistanceInMeters()` helper (used by processor)
- Deprecate or remove - location now comes from server

**`src/hooks/distribution/useSessionTracking.ts`**
- Remove location recording logic (now server-side)
- Convert to read-only: subscribe to session updates via Supabase Realtime
- Session is auto-managed by tracker webhook

**`src/hooks/distribution/useRouteStops.ts`**
- Remove phone GPS proximity detection
- Get `currentStop` from session's `current_stop_id` (set by tracker)
- Keep manual stop selection for edge cases

---

### 5. Simplify DistributionContext

**File:** `src/contexts/DistributionContext.tsx`

Remove:
- `currentLocation` from phone GPS
- Phone-based `inTransit` and `newStopDetected` logic

Keep:
- `currentStop` (now from session, not phone proximity)
- `stopConfirmed`, `confirmStop`, `changeStop` (volunteers still confirm for check-ins)
- Route/stop data fetching

Add:
- Supabase Realtime subscription for session/location updates

---

### 6. Update Volunteer Portal

**File:** `src/app/volunteer-portal/distributing/page.tsx`

- Remove location permission requests
- Show current stop from session (auto-detected by van tracker)
- Keep manual stop override option (for tracker delays/issues)
- Check-in functionality unchanged

---

### 7. Update Find Us Page

**File:** `src/app/find-us/page.tsx`

- Add Supabase Realtime subscription for instant updates (instead of 30s polling)
- Display van name on cards/map
- Logic mostly unchanged - already uses `van_location` table

---

### 8. Update Types

**File:** `src/types/distribution.ts`

Add:
```typescript
interface Van {
    id: string;
    name: string;
    routeId: string | null;
    trackerDeviceId: string | null;
    trackerType: string | null;
    isActive: boolean;
}
```

Update `DistributionSession` and `VanLocation` to include `vanId`.

---

### 9. Database Actions

**File:** `src/db/actions/sessions.ts`

Add:
- `getActiveSessionForVan(vanId)`
- `getLatestVanLocationByVan(vanId)`
- `fetchVansWithRoutes()`

Update:
- `fetchActiveDistributionSessions()` - join van table, include van name

---

## Implementation Order

1. **Database** - Schema + migration
2. **Types** - Add Van type, update existing types
3. **Tracker layer** - Create abstraction + processor
4. **API endpoint** - Webhook route
5. **DB actions** - New van-based functions
6. **Hooks** - Refactor to read-only/subscription mode
7. **Context** - Simplify, add realtime subscriptions
8. **Volunteer portal** - Remove phone GPS, use session data
9. **Find Us page** - Add realtime subscriptions

---

## Files to Modify

| File | Change |
|------|--------|
| `src/db/schema.ts` | Add `van` table, update relations |
| `src/types/distribution.ts` | Add Van type, update Session/Location |
| `src/db/actions/sessions.ts` | Add van-based queries |
| `src/hooks/distribution/useLocation.ts` | Remove/deprecate phone GPS |
| `src/hooks/distribution/useSessionTracking.ts` | Convert to read-only subscription |
| `src/hooks/distribution/useRouteStops.ts` | Get stop from session, not phone |
| `src/contexts/DistributionContext.tsx` | Simplify, add realtime |
| `src/app/volunteer-portal/distributing/page.tsx` | Remove location requests |
| `src/app/find-us/page.tsx` | Add realtime subscription |
| `src/lib/constants/routes.ts` | Remove mock location config |

## New Files

| File | Purpose |
|------|---------|
| `src/lib/trackers/types.ts` | Tracker interfaces |
| `src/lib/trackers/index.ts` | Provider registry |
| `src/lib/trackers/processor.ts` | Location processing + stop detection |
| `src/lib/trackers/providers/generic.ts` | Placeholder tracker provider |
| `src/app/api/tracker/webhook/route.ts` | Receive tracker data |

---

## Notes

- **Tracker type TBD** - Generic provider is a placeholder. Update when tracker is chosen.
- **Van-route assignment** - Fixed for now. Add comment noting this may change to dynamic assignment.
- **Rollback** - Keep old hooks as deprecated initially. Can revert if issues arise.
- **AirTags won't work** - No API access, not real-time. Recommend dedicated GPS tracker with API (Tracki, Bouncie, etc.).
