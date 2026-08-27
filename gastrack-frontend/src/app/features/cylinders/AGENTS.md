# Cylinders Domain - Frontend

## Scope

Real-time oxygen cylinder monitoring with pressure tracking, status alerts, filtering, and statistics. This is the core domain of GasTrack.

---

## Structure

```
src/app/features/cylinders/
├── components/
│   ├── oxygen-tank-card/
│   │   └── oxygen-tank-card.component.ts
│   ├── tank-status-badge/
│   │   └── tank-status-badge.component.ts
│   └── tank-filters/
│       └── tank-filters.component.ts
├── pages/
│   └── cylinders-list/
│       └── cylinders-list.component.ts
├── services/
│   └── oxygen-tank.service.ts
├── cylinders.routes.ts
└── AGENTS.md
```

---

## Components

| Component                  | Type  | Location      | Description                                                             |
| -------------------------- | ----- | ------------- | ----------------------------------------------------------------------- |
| `OxygenTankCardComponent`  | Dumb  | `components/` | Display card for single cylinder with pressure bar, status, and details |
| `TankStatusBadgeComponent` | Dumb  | `components/` | Colored badge showing tank status (FULL, NORMAL, LOW, CRITICAL, EMPTY)  |
| `TankFiltersComponent`     | Dumb  | `components/` | Filter panel with search and status dropdown                            |
| `CylindersListComponent`   | Smart | `pages/`      | Main page listing all cylinders with filters                            |

### OxygenTankCardComponent

**Inputs:**

- `tank: OxygenTank` (required)

**Features:**

- Visual pressure bar with status-based colors
- Estimated remaining time calculation
- Consumption rate display
- Last reading timestamp

### TankStatusBadgeComponent

**Inputs:**

- `status: TankStatus` (required)

**Status Colors:**
| Status | Background | Text | Description |
|--------|------------|------|-------------|
| FULL | emerald-100 | emerald-800 | >= 80% capacity |
| NORMAL | blue-100 | blue-800 | 30-80% capacity |
| LOW | amber-100 | amber-800 | 10-30% capacity |
| CRITICAL | red-100 | red-800 | < 10% capacity |
| EMPTY | gray-100 | gray-800 | < 5 bar |
| UNKNOWN | gray-100 | gray-600 | No recent readings |

### TankFiltersComponent

**Outputs:**

- `filtersChange: TankFilters`

**Filter Options:**

- Search by device_id
- Filter by status

---

## Services

### OxygenTankService

**Location:** `services/oxygen-tank.service.ts`

#### Signals

| Signal          | Type                     | Access   | Description           |
| --------------- | ------------------------ | -------- | --------------------- |
| `tanks`         | `Signal<OxygenTank[]>`   | readonly | All tanks             |
| `isLoading`     | `Signal<boolean>`        | readonly | Loading state         |
| `filters`       | `Signal<TankFilters>`    | readonly | Current filters       |
| `filteredTanks` | `Signal<OxygenTank[]>`   | computed | Filtered tanks list   |
| `statistics`    | `Signal<TankStatistics>` | computed | Aggregated statistics |

#### Methods

| Method          | Parameters             | Returns                   | Description            |
| --------------- | ---------------------- | ------------------------- | ---------------------- |
| `updateFilters` | `Partial<TankFilters>` | `void`                    | Update filter criteria |
| `clearFilters`  | -                      | `void`                    | Reset all filters      |
| `getTankById`   | `id: string`           | `OxygenTank \| undefined` | Find tank by ID        |

#### Business Logic

**Status Calculation:**

```typescript
calculateStatus(pressure, capacity) {
  const percentage = (pressure / capacity) * 100;
  if (pressure < 5) return EMPTY;
  if (percentage < 10) return CRITICAL;
  if (percentage < 30) return LOW;
  if (percentage >= 80) return FULL;
  return NORMAL;
}
```

**Alert Triggers:**

- New CRITICAL tank → Error notification
- New LOW tank → Warning notification

---

## Models

**Location:** `@models/oxygen-tank.model.ts`

```typescript
interface OxygenTank {
  id: string;
  device_id: string; // ESP32 sensor ID
  serial_number: string;
  capacity_bar: number;
  current_pressure_bar: number;
  location: string;
  status: TankStatus;
  last_reading_at: Date;
  consumption_rate_bar_per_hour: number;
  estimated_remaining_hours: number | null;
  readings_count_24h: number;
}

enum TankStatus {
  FULL = 'FULL',
  NORMAL = 'NORMAL',
  LOW = 'LOW',
  CRITICAL = 'CRITICAL',
  EMPTY = 'EMPTY',
  UNKNOWN = 'UNKNOWN',
}

interface TankFilters {
  searchTerm: string;
  status: TankStatus | null;
  startDate: Date | null;
  endDate: Date | null;
}

interface TankStatistics {
  total_tanks: number;
  full_tanks: number;
  normal_tanks: number;
  low_tanks: number;
  critical_tanks: number;
  average_pressure: number;
}
```

---

## Business Rules

1. **Status is calculated from pressure percentage**, not stored directly
2. **Alerts are automatic** when tanks transition to CRITICAL or LOW
3. **Consumption rate** determines estimated remaining time
4. **Real-time updates** via 30-second polling intervals
5. **Device ID** is the primary identifier for ESP32 sensors

---

## Routes

```typescript
// cylinders.routes.ts
export const CYLINDERS_ROUTES: Routes = [
  {
    path: '',
    component: CylindersListComponent,
  },
  // Future: detail page
  // { path: ':id', component: CylinderDetailComponent },
];
```

---

## Related Files

| Type               | Location                                 |
| ------------------ | ---------------------------------------- |
| Models             | `@models/oxygen-tank.model.ts`           |
| Core Notifications | `@core/services/notification.service.ts` |
| UI Card            | `@shared/components/ui/card/`            |
| UI Button          | `@shared/components/ui/button/`          |

---

## Planned Features

- [ ] Real-time WebSocket updates
- [ ] Cylinder detail page with readings history
- [ ] Export to CSV/PDF
- [ ] Geolocation map view
- [ ] Maintenance scheduling
