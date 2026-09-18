<!-- UniERP-Agent-Protocol: 1.1.0 -->
# UniERP Repository Agent Entrypoint: Contracts (`contracts`)

This repository is one delivery unit in the UniERP polyrepo. Before analysis, planning, review, or mutation, every
AI agent from every provider MUST read and follow:

1. the workspace entrypoint at [`../AGENTS.md`](../AGENTS.md);
2. the canonical standard at
   [`../platform/docs/standards/AI_AGENT_DEVELOPMENT_PROTOCOL.md`](../platform/docs/standards/AI_AGENT_DEVELOPMENT_PROTOCOL.md);
3. the owning platform documents selected through
   [`../platform/docs/PLATFORM_CATALOG.md`](../platform/docs/PLATFORM_CATALOG.md).

If the workspace entrypoint or canonical standard is unavailable, the protocol bundle is incomplete. The agent
MUST stop before mutation and report the missing dependency. This bootstrap adds no weaker or conflicting rules.
Repository-specific additions may be appended below only when they narrow implementation behavior without
redefining platform ownership, security, contracts, or cross-platform standards.

---

## 1. Repository Identity & Mission

- **Repository**: `contracts`
- **Platform Owner**: `PLT-BIZ` (Business & Enterprise Architecture)
- **Architectural Layer**: **Layer 0 (Contracts & Specifications)**
- **Dependencies**: **ZERO dependencies** on any higher layers (L1–L7).
- **Mission**: Single authoritative source of truth for all cross-platform DTOs, OpenAPI schemas, event payload contracts, control center manifests, error envelopes, and system interfaces.

---

## 2. Inviolable Architectural Rules

1. **Zero Upward or Sideways Dependencies**:
   - Layer 0 must NEVER import from Layer 1 (`design-system`, `shared`), Layer 2 (`data`), Layer 3 (`api`, `idp`), or higher.
   - Any attempt to introduce runtime dependencies violates UniERP fundamental architecture and fails closed.
2. **Backward Compatibility & Immutability**:
   - Contracts are additive within a major version.
   - Breaking field changes require a new major version, migration path, and owner sign-off.
3. **Exact Decimal Representation**:
   - All financial and quantity schemas must use stringified exact decimal representations (`string`), never floating point numbers.

---

## 3. Industrial Software Engineering Standards

1. **Build Output Integrity**:
   - `dist/` contains both CommonJS and ESM artifacts with complete `.d.ts` declaration maps.
   - Contract tests must run deterministically with zero scratch/test-fixer scripts left in the root directory.
2. **Catalog Validation**:
   - Control center catalogs (`CONTROL_CENTER_APPS`) must validate sequence, authority, and dependency topologies via `assertValidControlCenterCatalog()`.

---

## 4. Verification Gates & Mandatory Toolchain

Before declaring any cycle `DONE`, run and verify:

```powershell
pnpm typecheck              # Strict TypeScript verification
pnpm build                  # Build CJS/ESM dist outputs
pnpm test                   # Vitest contract validation tests
node scripts/check-layer.mjs # Canonical Layer Gate enforcement
```
