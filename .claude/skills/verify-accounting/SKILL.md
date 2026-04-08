---
name: verify-accounting
description: Verify Xero accounting integration code (dual-mode resolver, sync handler, OrderSyncLog) — owned by accountant agent.
argument-hint: <file-or-handler-path>
disable-model-invocation: true
allowed-tools: Read, Grep, Glob
---

# Verify Accounting

Audit Yellow Ladder's Xero accounting integration for correctness. Yellow Ladder uses **dual-mode** accounting (per-company connection + platform-level fallback) — this skill validates the resolver, sync, and audit trail logic.

**Owner:** `accountant` agent (when created). For now, the architect or backend-engineer can run it.

**Argument:**
- `$1` — file or handler path to verify (e.g., `libs/backend/integrations/accounting/src/accounting.service.ts` or `libs/backend/integrations/accounting/src/event-handlers/order-confirmed.handler.ts`)

## Pre-flight checks

1. Read `.claude/rules/architecture.md` §Accounting (Xero) — Dual-Mode
2. Read `.claude/rules/domain-model.md` §Critical Integration Events for the Xero sync flow
3. Confirm the file is in `libs/backend/integrations/accounting/` or `libs/backend/infra/xero/`

## Steps

Apply each check and report findings as **CRITICAL** (security or data correctness) or **WARNING** (correctness concern).

### 1. AccountingConnectionResolver usage

- [ ] All Xero operations route through `AccountingConnectionResolver.resolveForCompany(companyId)` — never instantiate Xero clients directly
- [ ] **CRITICAL** if a service constructs a Xero API client without going through the resolver
- [ ] The resolver returns the per-company connection if present, else the platform-level fallback

### 2. Mode-aware sync logic

- [ ] **Per-company mode:** orders sync directly into the merchant's own Xero ledger using their connection
- [ ] **Platform-level mode:** orders sync into the platform Xero account with a **mandatory tracking category per invoice line** that identifies the originating company
- [ ] **CRITICAL** if platform-level sync is missing the tracking category (would lose company attribution in the platform Xero account)
- [ ] **CRITICAL** if the sync logic branches on mode but produces inconsistent line-item shapes

### 3. OrderSyncLog audit trail

- [ ] Every sync attempt produces an `OrderSyncLog` record with:
  - `companyId` — which company the sync is for
  - `mode` — `per_company` or `platform_level`
  - `syncedAt` — timestamp
  - `status` — `success`, `failed`, `skipped`
  - `errorDetails` — populated on failure (without leaking secrets)
  - `xeroInvoiceId` — populated on success
- [ ] **CRITICAL** if `OrderSyncLog` is missing for any successful or failed sync
- [ ] **WARNING** if `errorDetails` contains raw API response that may include credentials

### 4. Per-company feature flag

- [ ] The platform-level fallback can be disabled per company via a feature flag (`Company.platformAccountingFallbackEnabled` or equivalent)
- [ ] **WARNING** if the resolver does not check this flag before falling back to platform-level

### 5. Idempotency

- [ ] The daily sync job is idempotent — re-running on the same day must NOT produce duplicate Xero invoices
- [ ] Idempotency key should be `OrderSyncLog.orderId` or the Xero idempotency key API
- [ ] **CRITICAL** if the sync job creates duplicate invoices on retry

### 6. Failure handling

- [ ] Failures on one company do NOT halt the run for other companies
- [ ] Failed companies are retried on the next run
- [ ] **WARNING** if a single company failure can crash the entire daily sync

### 7. Monetary correctness

- [ ] All monetary amounts are integers (pence) at the database layer
- [ ] When sending to Xero, convert pence → decimal once at the API boundary
- [ ] **CRITICAL** if the sync sends raw pence values to Xero (Xero expects decimal)
- [ ] **CRITICAL** if the conversion drops or rounds digits incorrectly

### 8. Webhook signature verification

- [ ] If Xero webhooks are consumed (push notifications from Xero back to Yellow Ladder), the webhook handler must verify the signature
- [ ] **CRITICAL** if webhook handler is unsigned

### 9. Domain event integration

- [ ] The sync is triggered by a Cloud Run Job (daily 23:59), not by domain events from individual orders
- [ ] **WARNING** if individual `OrderConfirmed` events trigger immediate Xero sync — this couples Xero availability to order confirmation latency

### 10. Audit logging

- [ ] All Xero connection changes (per-company or platform-level credentials updated, fallback enabled/disabled) are logged via `@AuditLog()` or `AuditService.logChange()`

## Output format

```
# Accounting Verification: ${1}

## CRITICAL
- libs/backend/integrations/accounting/src/accounting.service.ts:88
  Issue: Platform-level sync is missing the tracking category on the invoice line.
  Why it matters: Without per-company tracking categories, the platform Xero account loses
  attribution and cross-company financials are unrecoverable.
  Fix: Add `lineItem.trackingCategories = [{ name: 'Company', value: companyId }]` for every
       line in platform-level mode.

## WARNING
- libs/backend/integrations/accounting/src/event-handlers/...handler.ts:42
  Issue: Sync runs synchronously on every OrderConfirmed event.
  Why it matters: Couples Xero API availability to order confirmation latency.
  Fix: Move sync to the daily Cloud Run Job. The order will be picked up in the next sync window.

## OK
- AccountingConnectionResolver is used consistently
- OrderSyncLog records are created for every sync attempt
- Idempotency key (orderId) prevents duplicate invoices

## Summary
- CRITICAL: 1
- WARNING: 1
- OK checks: 12
```

## Hard rules

- **READ-ONLY** — never modify files
- **Platform-level isolation is security-critical** — flag any missing tracking categories as CRITICAL
- **Reference `.claude/rules/architecture.md` §Accounting** for every finding
- **Idempotency, audit trail, and failure isolation are non-negotiable**

## Hand-off

After the audit:
- Pass findings to `accountant` agent (or `backend-engineer` if accountant doesn't exist yet)
- For schema-level issues (missing `OrderSyncLog` columns, etc.), hand off to `database-engineer`
- Escalate any architectural concerns to `architect`
