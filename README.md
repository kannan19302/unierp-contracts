# unierp-contracts

**Layer 0 — the root of the UniERP dependency graph.**

The single source of truth for API contracts, event schemas, and shared entity
types. Publishes `@unerp/contracts` and `@unerp/events`.

## Why this repository has no dependencies

L0 depends on nothing, by construction. That is not an accident of the current
code — it is the property that keeps the whole fifteen-repository graph acyclic
for the life of the platform:

> "Because L0 has zero dependencies, it can never be made to depend on an
> implementation. That is the single property that keeps the whole graph acyclic
> for twenty years."
> — `PLATFORM_ARCHITECTURE.md` § 7.1

Adding a dependency here — on the API, on Prisma, on a UI package — is not a
refactor to be reviewed on its merits. It inverts the layering, and CI rejects
it.

## What lives here

```
src/
├── http/      Zod schemas per endpoint  →  OpenAPI 3.1, Nest DTOs, TS/Py/Java/Go clients
├── events/    Domain event schemas      →  outbox publisher + consumer types, AsyncAPI
└── entities/  Shared domain types       →  extension-api typings
```

Downstream artefacts are **generated** from these definitions. Hand-editing
generated output is a build failure (ADR-008); adding an endpoint means editing
the contract first.

## Extraction status

Extracted from the `ERPSys` monorepo as § 14 Phase 3.1 — the first extraction,
chosen because it has no dependencies and is therefore the safest to move.

**The monorepo copy at `packages/contracts` is still authoritative.** Per § 14,
a consumer is only switched to the published package after that package is
publishable, and the monorepo remains buildable at each extraction tag until its
consumers have switched. Until a registry is available this repository is the
extraction target, not yet the source of truth.

Rollback is a one-line `pnpm` override change pointing consumers back at the
workspace path.
