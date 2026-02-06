# Creature Model Frontend Integration Guide

> **Type:** Integration Guide
> **Status:** Draft
> **Last updated:** 2026-02-06
> **Related backend branch:** `data-refactor/new-creature-data-system`
> **Frontend repo:** `2025_IMAO_DnD_Assistant_frontend`

---

## A. Overview

This document describes the changes required on the frontend to integrate the new structured creature data model from the backend. The backend now provides:

- **Movement** — structured speeds (walk, fly, swim, climb, burrow, hover)
- **Vision** — structured senses (darkvision, blindsight, truesight, tremorsense)
- **StructuredActions** — parsed attack/action data with damage rolls, save DCs, area effects
- **RuntimeState** (future) — HP tracking, conditions, resources, concentration

---

## B. Current Frontend State

### B.1 Type Definitions

**File:** `src/entities/creature/model/types.ts`

```typescript
// Current Speed type — array of text values
interface Speed {
  value: string;        // e.g., "30 ft."
  name?: string;        // e.g., "fly"
  additional?: string;  // e.g., "(hover)"
}

// Current Senses type — passive perception + array
interface Senses {
  passivePerception: string;
  senses?: Sense[];  // Array of {name, value, additional?}
}

// Current Action type — simple name/value pairs
interface Action {
  name: string;
  value: string;  // raw text description
}

// Existing AttackLLM — already structured (from LLM parsing)
interface AttackLLM {
  name: string;
  type: 'melee' | 'ranged' | 'area';
  attackBonus: string;
  reach?: string;
  range?: string;
  target: string;
  damage: DamageLLM;
  attacks?: MultiAttackLLM[];
  additionalEffects?: string[];
  area?: AreaLLM;
  saveDc?: string;
  saveType?: string;
  onFail?: string;
  onSuccess?: string;
}
```

### B.2 Components Using Creature Data

| Component | File | Currently Uses |
|-----------|------|----------------|
| FightStatsSection | `pages/bestiary/ui/creatureStatblock/fightStatsSection/` | `speed[0].value` only |
| SkillsAndSensesSection | `pages/bestiary/ui/creatureStatblock/skillsAndSensesSection/` | `senses.passivePerception`, `senses.senses[]` |
| AttackModal | `pages/encounterTracker/ui/attackModal/` | `attacksLLM[]` |
| CreatureToken | `pages/encounterTracker/ui/battleMap/creatureToken/` | `cellsCoords` only, no speed |
| FogOverlay | `pages/encounterTracker/ui/battleMap/fogOverlay/` | Manual fog, no vision radius |

### B.3 Generator Forms (Not Persisted)

The statblock generator has forms for structured data that are **not saved** to the creature:

| Form | File | Fields |
|------|------|--------|
| MonsterSpeedForm | `pages/statblockGenerator/ui/speedForm/` | `speed`, `burrowSpeed`, `climbSpeed`, `flySpeed`, `swimSpeed`, `hover` |
| SensesForm | `pages/statblockGenerator/ui/sensesForm/` | `blindsight`, `darkvision`, `tremorsense`, `truesight`, `isBlindBeyond` |

### B.4 Infrastructure Ready (But Not Active)

| Feature | File | Status |
|---------|------|--------|
| VisibilityEngine | `shared/lib/visibility/visibilityEngine.ts` | Types defined, `computeVisibleCells()` not implemented |
| WalkabilityGrid | `entities/encounter/model/types.ts` | 2D grid stored, not used for pathfinding |
| OcclusionGrid | `entities/encounter/model/types.ts` | Stored, not used for vision |
| TerrainEdges | `entities/encounter/model/types.ts` | Stored, not used |

---

## C. New Backend Types

### C.1 Movement (Go)

```go
type CreatureMovement struct {
    Walk   int  `json:"walk" bson:"walk"`           // Base walking speed in feet
    Fly    int  `json:"fly,omitempty"`              // Flying speed
    Swim   int  `json:"swim,omitempty"`             // Swimming speed
    Climb  int  `json:"climb,omitempty"`            // Climbing speed
    Burrow int  `json:"burrow,omitempty"`           // Burrowing speed
    Hover  bool `json:"hover,omitempty"`            // Can hover while flying
}
```

### C.2 Vision (Go)

```go
type CreatureVision struct {
    Darkvision  int `json:"darkvision,omitempty"`   // See in darkness (feet)
    Blindsight  int `json:"blindsight,omitempty"`   // See without eyes (feet)
    Truesight   int `json:"truesight,omitempty"`    // See through illusions (feet)
    Tremorsense int `json:"tremorsense,omitempty"`  // Detect vibrations (feet)
}
```

### C.3 StructuredAction (Go)

```go
type StructuredAction struct {
    ID          string           `json:"id"`           // Unique ID (transliterated name)
    Name        string           `json:"name"`         // Display name
    Category    ActionCategory   `json:"category"`     // "attack", "spell", "ability", "other"

    // Attack roll (nullable)
    AttackRoll  *AttackRollData  `json:"attackRoll,omitempty"`

    // Saving throw (nullable)
    SavingThrow *SavingThrowData `json:"savingThrow,omitempty"`

    // Area of effect (nullable)
    AreaOfEffect *AreaOfEffect   `json:"areaOfEffect,omitempty"`

    // Damage rolls (can be multiple)
    Damage      []DamageRoll     `json:"damage,omitempty"`

    // Applied effects (conditions, etc.)
    Effects     []ActionEffect   `json:"effects,omitempty"`

    // Raw text for non-standard effects
    Description string           `json:"description,omitempty"`
}

type AttackRollData struct {
    Type     AttackRollType `json:"type"`      // "melee_weapon", "ranged_weapon", "melee_spell", "ranged_spell"
    Modifier int            `json:"modifier"`  // Attack bonus
    Reach    int            `json:"reach,omitempty"`     // Melee reach in feet
    Range    int            `json:"range,omitempty"`     // Normal range
    LongRange int           `json:"longRange,omitempty"` // Long range (disadvantage)
}

type SavingThrowData struct {
    Ability   AbilityType `json:"ability"`   // "str", "dex", "con", "int", "wis", "cha"
    DC        int         `json:"dc"`
    OnSuccess string      `json:"onSuccess,omitempty"` // "half", "none", etc.
    OnFailure string      `json:"onFailure,omitempty"` // Description
}

type DamageRoll struct {
    DiceCount  int        `json:"diceCount"`
    DiceType   int        `json:"diceType"`   // 4, 6, 8, 10, 12, 20
    Modifier   int        `json:"modifier"`
    DamageType DamageType `json:"damageType"` // "slashing", "fire", etc.
}

type ActionEffect struct {
    Type        ConditionType `json:"type,omitempty"`        // "prone", "grappled", etc.
    Duration    string        `json:"duration,omitempty"`    // "1 round", "until end of turn"
    Description string        `json:"description,omitempty"` // For non-standard effects
}
```

---

## D. TypeScript Types to Add

Add to `src/entities/creature/model/types.ts`:

```typescript
// ============================================
// NEW STRUCTURED TYPES (Backend alignment)
// ============================================

/**
 * Structured movement speeds in feet.
 * Replaces the legacy Speed[] array for automation.
 */
export interface CreatureMovement {
  walk: number;
  fly?: number;
  swim?: number;
  climb?: number;
  burrow?: number;
  hover?: boolean;
}

/**
 * Structured vision/senses in feet.
 * Replaces the legacy Senses.senses[] array for automation.
 */
export interface CreatureVision {
  darkvision?: number;
  blindsight?: number;
  truesight?: number;
  tremorsense?: number;
}

/**
 * Action categories for StructuredAction.
 */
export type ActionCategory = 'attack' | 'spell' | 'ability' | 'other';

/**
 * Attack roll types.
 */
export type AttackRollType =
  | 'melee_weapon'
  | 'ranged_weapon'
  | 'melee_spell'
  | 'ranged_spell';

/**
 * D&D ability types for saving throws.
 */
export type AbilityType = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

/**
 * D&D damage types.
 */
export type DamageType =
  | 'slashing' | 'piercing' | 'bludgeoning'
  | 'fire' | 'cold' | 'lightning' | 'thunder'
  | 'acid' | 'poison' | 'necrotic' | 'radiant'
  | 'force' | 'psychic';

/**
 * D&D condition types.
 */
export type ConditionType =
  | 'blinded' | 'charmed' | 'deafened' | 'frightened'
  | 'grappled' | 'incapacitated' | 'invisible' | 'paralyzed'
  | 'petrified' | 'poisoned' | 'prone' | 'restrained'
  | 'stunned' | 'unconscious' | 'exhaustion';

/**
 * Area of effect shapes.
 */
export type AreaShape = 'sphere' | 'cube' | 'cone' | 'line' | 'cylinder';

/**
 * Attack roll data for StructuredAction.
 */
export interface AttackRollData {
  type: AttackRollType;
  modifier: number;
  reach?: number;
  range?: number;
  longRange?: number;
}

/**
 * Saving throw data for StructuredAction.
 */
export interface SavingThrowData {
  ability: AbilityType;
  dc: number;
  onSuccess?: string;
  onFailure?: string;
}

/**
 * Area of effect data for StructuredAction.
 */
export interface AreaOfEffect {
  shape: AreaShape;
  size: number;
  origin?: 'self' | 'point' | 'creature';
}

/**
 * Damage roll for StructuredAction.
 */
export interface DamageRoll {
  diceCount: number;
  diceType: number;  // 4, 6, 8, 10, 12, 20
  modifier: number;
  damageType: DamageType;
}

/**
 * Effect applied by StructuredAction.
 */
export interface ActionEffect {
  type?: ConditionType;
  duration?: string;
  description?: string;  // For non-standard effects
}

/**
 * Structured action for automation.
 * Replaces/complements AttackLLM.
 */
export interface StructuredAction {
  id: string;
  name: string;
  category: ActionCategory;
  attackRoll?: AttackRollData;
  savingThrow?: SavingThrowData;
  areaOfEffect?: AreaOfEffect;
  damage?: DamageRoll[];
  effects?: ActionEffect[];
  description?: string;
}

// ============================================
// UPDATED CreatureFullData
// ============================================

export interface CreatureFullData {
  // ... existing fields ...

  // Legacy fields (keep for backward compatibility)
  speed: Speed[];
  senses: Senses;
  attacksLLM?: AttackLLM[];

  // NEW: Structured fields for automation
  movement?: CreatureMovement;
  vision?: CreatureVision;
  structuredActions?: StructuredAction[];
}
```

---

## E. Component Changes

### E.1 FightStatsSection — Display All Speeds

**File:** `pages/bestiary/ui/creatureStatblock/fightStatsSection/FightStatsSection.tsx`

**Current (line ~92):**
```tsx
<span>{creature.speed[0].value}</span>
```

**Updated:**
```tsx
const formatMovement = (creature: CreatureFullData): string => {
  // Prefer new structured movement
  if (creature.movement) {
    const parts: string[] = [];
    if (creature.movement.walk) parts.push(`${creature.movement.walk} ft.`);
    if (creature.movement.fly) {
      parts.push(`fly ${creature.movement.fly} ft.${creature.movement.hover ? ' (hover)' : ''}`);
    }
    if (creature.movement.swim) parts.push(`swim ${creature.movement.swim} ft.`);
    if (creature.movement.climb) parts.push(`climb ${creature.movement.climb} ft.`);
    if (creature.movement.burrow) parts.push(`burrow ${creature.movement.burrow} ft.`);
    return parts.join(', ') || '0 ft.';
  }

  // Fallback to legacy speed array
  return creature.speed.map(s => {
    const name = s.name ? `${s.name} ` : '';
    const additional = s.additional ? ` ${s.additional}` : '';
    return `${name}${s.value}${additional}`;
  }).join(', ');
};

// In JSX:
<span>{formatMovement(creature)}</span>
```

### E.2 SkillsAndSensesSection — Display Vision Types

**File:** `pages/bestiary/ui/creatureStatblock/skillsAndSensesSection/SkillsAndSensesSection.tsx`

**Updated:**
```tsx
const formatVision = (creature: CreatureFullData): string[] => {
  const parts: string[] = [];

  // Prefer new structured vision
  if (creature.vision) {
    if (creature.vision.darkvision) parts.push(`darkvision ${creature.vision.darkvision} ft.`);
    if (creature.vision.blindsight) parts.push(`blindsight ${creature.vision.blindsight} ft.`);
    if (creature.vision.truesight) parts.push(`truesight ${creature.vision.truesight} ft.`);
    if (creature.vision.tremorsense) parts.push(`tremorsense ${creature.vision.tremorsense} ft.`);
  } else if (creature.senses?.senses) {
    // Fallback to legacy senses array
    creature.senses.senses.forEach(s => {
      parts.push(`${s.name} ${s.value}${s.additional ? ` ${s.additional}` : ''}`);
    });
  }

  return parts;
};
```

### E.3 Generator Forms — Persist to Creature

**MonsterSpeedForm** should map to `CreatureMovement`:

```typescript
// When saving creature from generator
const mapSpeedFormToMovement = (form: MonsterSpeedFormState): CreatureMovement => ({
  walk: parseInt(form.speed) || 0,
  fly: form.flySpeed ? parseInt(form.flySpeed) : undefined,
  swim: form.swimSpeed ? parseInt(form.swimSpeed) : undefined,
  climb: form.climbSpeed ? parseInt(form.climbSpeed) : undefined,
  burrow: form.burrowSpeed ? parseInt(form.burrowSpeed) : undefined,
  hover: form.hover || undefined,
});
```

**SensesForm** should map to `CreatureVision`:

```typescript
const mapSensesFormToVision = (form: SensesFormState): CreatureVision => ({
  darkvision: form.darkvision ? parseInt(form.darkvision) : undefined,
  blindsight: form.blindsight ? parseInt(form.blindsight) : undefined,
  truesight: form.truesight ? parseInt(form.truesight) : undefined,
  tremorsense: form.tremorsense ? parseInt(form.tremorsense) : undefined,
});
```

### E.4 AttackModal — Use StructuredActions

**Decision needed:** The frontend already has `AttackLLM` which is similar to `StructuredAction`. Options:

| Option | Pros | Cons |
|--------|------|------|
| **A. Keep both** | No breaking changes | Duplicate data, sync issues |
| **B. Replace AttackLLM with StructuredAction** | Single source of truth | Breaking change, migration needed |
| **C. Map StructuredAction → AttackLLM** | Backend canonical, frontend unchanged | Transformation layer |

**Recommended: Option C** (short-term) — Create a mapper:

```typescript
const mapStructuredActionToAttackLLM = (action: StructuredAction): AttackLLM => ({
  name: action.name,
  type: action.attackRoll
    ? (action.attackRoll.type.includes('melee') ? 'melee' : 'ranged')
    : (action.areaOfEffect ? 'area' : 'melee'),
  attackBonus: action.attackRoll ? `+${action.attackRoll.modifier}` : '',
  reach: action.attackRoll?.reach ? `${action.attackRoll.reach} ft.` : undefined,
  range: action.attackRoll?.range
    ? `${action.attackRoll.range}/${action.attackRoll.longRange || action.attackRoll.range} ft.`
    : undefined,
  target: 'one target',
  damage: action.damage?.[0] ? {
    dice: `${action.damage[0].diceCount}d${action.damage[0].diceType}`,
    bonus: action.damage[0].modifier,
    type: action.damage[0].damageType,
  } : { dice: '', bonus: 0, type: '' },
  saveDc: action.savingThrow ? `${action.savingThrow.dc}` : undefined,
  saveType: action.savingThrow?.ability,
  additionalEffects: action.effects?.map(e => e.description || e.type || ''),
});
```

### E.5 Encounter Participant — Store Movement/Vision

**File:** `entities/encounter/model/types.ts`

Add to `Participant`:

```typescript
export interface Participant {
  // ... existing fields ...

  // NEW: For automation
  movement?: CreatureMovement;
  vision?: CreatureVision;
}
```

### E.6 VisibilityEngine — Activate with Vision Data

**File:** `shared/lib/visibility/visibilityEngine.ts`

```typescript
export const computeVisibleCells = (
  origin: { x: number; y: number },
  vision: CreatureVision,
  occlusion: OcclusionGrid,
  edges: TerrainEdges,
  cellSizeFt: number = 5
): Set<string> => {
  const visible = new Set<string>();

  // Use the maximum vision range
  const maxRange = Math.max(
    vision.darkvision || 0,
    vision.blindsight || 0,
    vision.truesight || 0,
    vision.tremorsense || 0,
    60 // Base vision in light
  );

  const radiusCells = Math.ceil(maxRange / cellSizeFt);

  // Ray-casting algorithm for visibility
  // ... implementation ...

  return visible;
};
```

### E.7 FogOverlay — Auto-Reveal by Vision

**File:** `pages/encounterTracker/ui/battleMap/fogOverlay/FogOverlay.tsx`

Update auto-reveal listener to use creature vision:

```typescript
// In autoRevealFogOnMove.listener.ts
const revealFogForCreature = (
  participant: Participant,
  fogGrid: FogHistoryGrid,
  occlusion: OcclusionGrid
) => {
  const vision = participant.vision || { darkvision: 0 };
  const visibleCells = computeVisibleCells(
    participant.cellsCoords,
    vision,
    occlusion,
    edges
  );

  // Update fog grid with visible cells
  visibleCells.forEach(cellKey => {
    const [x, y] = cellKey.split(',').map(Number);
    fogGrid[y][x] = 1; // revealed
  });
};
```

---

## F. Implementation Priority

### Phase 1: Type Alignment (Required First)

| Task | Files | Effort |
|------|-------|--------|
| Add TypeScript types | `entities/creature/model/types.ts` | 1h |
| Update `CreatureFullData` interface | Same file | 30m |
| Add types to API response handling | `entities/creature/api/types.ts` | 30m |

### Phase 2: Display Components

| Task | Files | Effort |
|------|-------|--------|
| Update FightStatsSection | `pages/bestiary/.../FightStatsSection.tsx` | 1h |
| Update SkillsAndSensesSection | `pages/bestiary/.../SkillsAndSensesSection.tsx` | 1h |
| Add movement icons (fly, swim, etc.) | Same + assets | 2h |

### Phase 3: Generator Persistence

| Task | Files | Effort |
|------|-------|--------|
| Map speed form → movement | `pages/statblockGenerator/...` | 2h |
| Map senses form → vision | Same | 1h |
| Update save creature API call | `entities/generatedCreature/...` | 1h |

### Phase 4: Encounter Integration

| Task | Files | Effort |
|------|-------|--------|
| Add movement/vision to Participant | `entities/encounter/model/types.ts` | 1h |
| Copy movement/vision when adding to encounter | `pages/encounterTracker/...` | 2h |
| Create StructuredAction → AttackLLM mapper | `shared/lib/` | 2h |

### Phase 5: Automation Features

| Task | Files | Effort |
|------|-------|--------|
| Implement VisibilityEngine | `shared/lib/visibility/` | 4h |
| Connect fog auto-reveal to vision | `pages/encounterTracker/...` | 3h |
| Movement validation (pathfinding) | New files | 8h |
| Movement range indicator on drag | `CreatureToken.tsx` | 4h |

---

## G. API Contract Changes

### G.1 GET /api/bestiary/creature/:name

**Response additions:**

```json
{
  "name": { "rus": "Гоблин", "eng": "Goblin" },

  "speed": [{ "value": "30 ft." }],
  "senses": { "passivePerception": "9" },

  "movement": {
    "walk": 30
  },
  "vision": {
    "darkvision": 60
  },
  "structuredActions": [
    {
      "id": "scimitar",
      "name": "Scimitar",
      "category": "attack",
      "attackRoll": {
        "type": "melee_weapon",
        "modifier": 4,
        "reach": 5
      },
      "damage": [
        { "diceCount": 1, "diceType": 6, "modifier": 2, "damageType": "slashing" }
      ]
    }
  ]
}
```

### G.2 Backward Compatibility

- Legacy `speed[]` and `senses` fields remain for old clients
- New clients should prefer `movement` and `vision` when present
- Check existence: `creature.movement ?? parseSpeedArray(creature.speed)`

---

## H. Migration Considerations

### H.1 Existing Creatures in Encounters

When loading an encounter with creatures that don't have `movement`/`vision`:

```typescript
const ensureStructuredData = (participant: Participant): Participant => ({
  ...participant,
  movement: participant.movement ?? parseSpeedToMovement(participant.speed),
  vision: participant.vision ?? parseSensesToVision(participant.senses),
});
```

### H.2 User-Created Creatures

User creatures created before this update won't have structured fields. Options:

1. **Lazy migration** — Parse on read, save on next edit
2. **Background migration** — Server-side job to update all
3. **Generator only** — Only new creatures get structured fields

**Recommended:** Option 1 (lazy migration) with fallback rendering.

---

## I. Testing Checklist

### I.1 Type Safety

- [ ] TypeScript compiles without errors
- [ ] No `any` types in new code
- [ ] API responses match expected types

### I.2 Display

- [ ] Statblock shows all movement types (walk, fly, swim, climb, burrow)
- [ ] Hover is indicated for flying creatures
- [ ] Vision types displayed distinctly
- [ ] Fallback works for creatures without new fields

### I.3 Generator

- [ ] Speed form values persist to creature.movement
- [ ] Senses form values persist to creature.vision
- [ ] Editing existing creature loads structured data into forms

### I.4 Encounter

- [ ] Adding creature to encounter copies movement/vision
- [ ] StructuredActions render in attack modal
- [ ] Damage rolls work with new damage format

### I.5 Automation (Phase 5)

- [ ] Vision radius reveals fog correctly
- [ ] Darkvision works in dark areas
- [ ] Movement validation respects walkability grid
- [ ] Movement indicator shows remaining distance

---

## J. Open Questions

| # | Question | Options | Decision |
|---|----------|---------|----------|
| 1 | Replace AttackLLM or keep both? | A: Keep both, B: Replace, C: Map | **C: Map** (short-term) |
| 2 | When to parse legacy speed[]? | On read / On save / Never | On read (lazy) |
| 3 | Who calculates visibility? | Frontend / Backend | **Frontend** (real-time) |
| 4 | Movement validation location? | Frontend / Backend | **Frontend** (UX), backend (verification) |

---

## K. Related Documents

- [creature-model-evolution.md](creature-model-evolution.md) — Backend model changes
- [migration-rules.md](migration-rules.md) — Data migration rules and technical debt

---

## Changelog

| Date | Change |
|------|--------|
| 2026-02-06 | Initial version created |
