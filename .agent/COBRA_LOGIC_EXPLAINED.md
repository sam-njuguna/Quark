# COBRA Data Processing Logic - Detailed Explanation

## Overview

This document explains how the system identifies, processes, and cross-references COBRA (Consolidated Omnibus Budget Reconciliation Act) records from both UHC (United Healthcare) invoices and UKG (Ultimate Kronos Group) COBRA payment data.

---

## Table of Contents

1. [How UHC COBRA Records Are Identified](#how-uhc-cobra-records-are-identified)
2. [UKG COBRA Data Source](#ukg-cobra-data-source)
3. [Cross-Referencing Logic](#cross-referencing-logic)
4. [Coverage Level/Tier Enrichment](#coverage-level-tier-enrichment)
5. [Data Flow Diagram](#data-flow-diagram)

---

## 1. How UHC COBRA Records Are Identified

### Database Schema

UHC invoice data is stored in the `uhcInvoiceRow` table with these relevant fields:

```sql
uhcInvoiceRow {
  status: text,              -- Status code (e.g., "C" for COBRA)
  benefitGroup1: text,       -- Benefit group 1
  benefitGroup2: text,       -- Benefit group 2
  normalizedName: text,      -- Standardized employee name
  planName: text,            -- Insurance plan name
  coverageType: text,        -- Coverage tier (Employee, Family, etc.)
  chargeAmount: text,        -- Invoice amount
}
```

### Identification Logic

A UHC record is identified as COBRA if **any** of these conditions are true:

```typescript
const isCobra =
  r.status === "C" || // Status is "C" (COBRA code)
  r.benefitGroup1?.toLowerCase().includes("cobra") || // Benefit group 1 contains "cobra"
  r.benefitGroup2?.toLowerCase().includes("cobra"); // Benefit group 2 contains "cobra"
```

#### Explanation:

- **Status Code "C"**: UHC uses "C" to explicitly mark COBRA coverage
- **Benefit Groups**: Sometimes COBRA is indicated in benefit group fields with text like "COBRA MEDICAL" or "cobra dental"
- **Case Insensitive**: Uses `.toLowerCase()` to catch variations like "COBRA", "Cobra", "cobra"

### Code Location

File: `/home/samnj/project/planparity/src/actions/admin/employees.ts`

```typescript
// Lines 219-222
const isCobra =
  r.status === "C" ||
  r.benefitGroup1?.toLowerCase().includes("cobra") ||
  r.benefitGroup2?.toLowerCase().includes("cobra");
```

---

## 2. UKG COBRA Data Source

### Database Schema

UKG COBRA data is stored in a **dedicated table** `cobraPaymentRow` (NOT in `ukgCensusRow`):

```sql
cobraPaymentRow {
  id: uuid,
  reconciliationRunId: uuid,
  firstName: text,
  lastName: text,
  normalizedName: text,           -- Key for matching with UHC
  qualifyingEvent: text,          -- Reason for COBRA (Termination, etc.)
  qualifyingEventDate: text,      -- When they became eligible
  status: text,                   -- COBRA enrollment status
  coverageStart: text,            -- Coverage start date
  coverageEnd: text,              -- Coverage end date
  paymentDate: text,              -- When payment was made
  coveragePeriod: text,           -- Period being paid for
  remittanceAmount: text,         -- Amount paid
  paymentType: text,              -- Payment method
}
```

### Why a Separate Table?

- COBRA participants are **not active employees** in the UKG census
- They have **different data fields** (qualifying events, coverage periods)
- Requires separate tracking for **payment status and compliance**

### When Viewing UKG + "Show COBRA"

The system switches from querying `ukgCensusRow` to `cobraPaymentRow`:

```typescript
// Lines 273-276
if (source === "UKG" && showCobra) {
  // Query cobraPaymentRow table instead of ukgCensusRow
  const cobraRows = await db
    .select()
    .from(cobraPaymentRow)  // ← Different table!
    .where(...)
}
```

---

## 3. Cross-Referencing Logic

### The Challenge

- **UHC** has COBRA records with plan and coverage info
- **UKG COBRA** has payment records but may lack plan details
- Need to **match them** to provide complete picture

### Solution: Normalized Name Matching

#### Step 1: Build Lookup Maps (on page load)

```typescript
// Lines 57-72: Create COBRA payment map
const cobraPaymentMap = new Map<string, CobraPaymentRecord>();
cobraPaymentData.forEach((cobra) => {
  if (cobra.normalizedName) {
    cobraPaymentMap.set(cobra.normalizedName.toLowerCase(), cobra);
  }
});

// Lines 74-94: Create UHC plan and coverage level maps
const uhcPlanMap = new Map<string, string>();
const uhcCoverageLevelMap = new Map<string, string>();
uhcData.forEach((uhc) => {
  if (uhc.normalizedName) {
    const key = uhc.normalizedName.toLowerCase();
    if (uhc.planName) uhcPlanMap.set(key, uhc.planName);
    if (uhc.coverageType) uhcCoverageLevelMap.set(key, uhc.coverageType);
  }
});
```

#### Step 2: Enrich UHC Records

When viewing **UHC** data with COBRA filter:

```typescript
// Lines 217-244
const data = rows.map((uhcRecord) => {
  const isCobra = /* ... identification logic ... */

  // Cross-reference with COBRA payment table
  const normalizedKey = uhcRecord.normalizedName?.toLowerCase();
  const cobraPayment = cobraPaymentMap.get(normalizedKey);

  // Flag if COBRA in UHC but NOT in UKG COBRA table
  const cobraInUhcOnly = isCobra && !cobraPayment;

  return {
    ...uhcRecord,
    isCobra,
    cobraInUhcOnly,        // ← Warning flag!
    cobraPayment: {        // ← Additional COBRA details
      qualifyingEvent: cobraPayment?.qualifyingEvent,
      qualifyingEventDate: cobraPayment?.qualifyingEventDate,
      status: cobraPayment?.status,
      coveragePeriod: cobraPayment?.coveragePeriod,
    }
  };
});
```

#### Step 3: Enrich UKG COBRA Records

When viewing **UKG** data with COBRA filter:

```typescript
// Lines 318-352
const data = cobraRows.map((cobraRecord) => {
  const normalizedKey = cobraRecord.normalizedName?.toLowerCase();

  // Look up plan and coverage from UHC
  const planName = uhcPlanMap.get(normalizedKey) || null;
  const coverageLevel = uhcCoverageLevelMap.get(normalizedKey) || null;

  return {
    id: cobraRecord.id,
    normalizedName: cobraRecord.normalizedName,
    employeeName: `${cobraRecord.firstName} ${cobraRecord.lastName}`,
    planName: planName, // ← From UHC!
    coverageLevel: coverageLevel, // ← From UHC!
    amountEE: cobraRecord.remittanceAmount,
    isCobra: true,
    cobraPayment: {
      // ← COBRA-specific details
      qualifyingEvent: cobraRecord.qualifyingEvent,
      qualifyingEventDate: cobraRecord.qualifyingEventDate,
      status: cobraRecord.status,
      coveragePeriod: cobraRecord.coveragePeriod,
    },
  };
});
```

---

## 4. Coverage Level/Tier Enrichment

### What is Coverage Level/Tier?

The coverage tier indicates who is covered:

- **Employee Only** (EE)
- **Employee + Spouse** (EE+SP)
- **Employee + Children** (EE+CH)
- **Family** (FAM)

### Why It Matters for COBRA

COBRA participants maintain the **same coverage tier** they had as active employees. However, the `cobraPaymentRow` table doesn't store this information natively.

### How We Get It

1. **UHC Invoice** stores `coverageType` field
2. We **match by normalized name** to the UHC record
3. Pull the `coverageType` and display it as `coverageLevel` in UKG COBRA view

```typescript
// Lines 80-94: Store coverage levels
const uhcCoverageLevelMap = new Map<string, string>();
uhcData.forEach((uhc) => {
  if (uhc.normalizedName && uhc.coverageType) {
    uhcCoverageLevelMap.set(uhc.normalizedName.toLowerCase(), uhc.coverageType);
  }
});

// Lines 327-329: Use coverage level when enriching COBRA
const coverageLevel = normalizedKey
  ? uhcCoverageLevelMap.get(normalizedKey) || null
  : null;
```

---

## 5. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     DATA INITIALIZATION                          │
│                  (Runs once per page load)                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
        ┌───────────────────────────────────────────┐
        │  Query cobraPaymentRow table              │
        │  → Build cobraPaymentMap                  │
        │    Key: normalizedName.toLowerCase()      │
        └───────────────────────────────────────────┘
                                │
                                ▼
        ┌───────────────────────────────────────────┐
        │  Query uhcInvoiceRow table                │
        │  → Build uhcPlanMap                       │
        │  → Build uhcCoverageLevelMap              │
        │    Key: normalizedName.toLowerCase()      │
        └───────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│  UHC TAB (source='UHC')   │   │  UKG TAB (source='UKG')   │
└───────────────────────────┘   └───────────────────────────┘
                │                               │
                │                               ▼
                │               ┌───────────────────────────┐
                │               │  showCobra = true?        │
                │               └───────────────────────────┘
                │                       │           │
                │                    YES│           │NO
                │                       ▼           ▼
                │               ┌──────────┐  ┌──────────┐
                │               │  Query   │  │  Query   │
                │               │  COBRA   │  │  UKG     │
                │               │ Payment  │  │ Census   │
                │               │  Table   │  │  Table   │
                │               └──────────┘  └──────────┘
                │                       │
                ▼                       ▼
    ┌───────────────────┐  ┌───────────────────────┐
    │  Identify COBRA   │  │  Enrich with UHC data │
    │  - status='C'     │  │  - planName           │
    │  - benefitGroup1  │  │  - coverageLevel      │
    │  - benefitGroup2  │  │  - from maps          │
    └───────────────────┘  └───────────────────────┘
                │                       │
                ▼                       ▼
    ┌───────────────────┐  ┌───────────────────────┐
    │  Cross-reference  │  │  Return enriched      │
    │  with COBRA map   │  │  COBRA records        │
    │  - Add cobraPaymt │  │                       │
    │  - Flag if missing│  │                       │
    └───────────────────┘  └───────────────────────┘
                │                       │
                └───────────┬───────────┘
                            ▼
                ┌───────────────────────┐
                │  Display in UI with:  │
                │  - COBRA badge        │
                │  - Coverage level     │
                │  - Warning if missing │
                │  - Tooltip details    │
                └───────────────────────┘
```

---

## Summary of COBRA Detection Methods

### UHC COBRA Identification

```typescript
✓ status === "C"
✓ benefitGroup1 contains "cobra" (case-insensitive)
✓ benefitGroup2 contains "cobra" (case-insensitive)
```

### UKG COBRA Source

```typescript
✓ Dedicated cobraPaymentRow table
✓ Contains payment and qualifying event data
✓ Enriched with UHC plan and coverage level via normalizedName match
```

### Cross-Reference Key

```typescript
normalizedName.toLowerCase(); // Used for all matching
```

---

## File Locations

- **Backend Logic**: `/home/samnj/project/planparity/src/actions/admin/employees.ts`
- **Frontend Display**: `/home/samnj/project/planparity/src/components/reconciliation/employee-list.tsx`
- **Database Schema**: `/home/samnj/project/planparity/src/db/schema/index.ts`
