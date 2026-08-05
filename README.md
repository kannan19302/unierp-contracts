# unierp-contracts

**Layer L0 — Contract** of the [UniERP](../unierp-platform) platform.
Depends on: nothing.

## What this is

Every API shape, event schema and shared entity type. OpenAPI, DTOs, clients and event typings are all *generated* from here.

## The invariant this repository owns

**Zero dependencies, by construction.** It can never be made to depend on an implementation — that single property is what keeps the whole dependency graph acyclic. CI asserts the dependency count is 0.

## The rule that applies everywhere

A repository may depend only on published artifacts of a **strictly lower
layer** — never sideways within a layer, never upward. A cycle is not
discouraged; it is unrepresentable, because the lower layer's package cannot
name the higher one.

See the [platform overview](../unierp-platform/README.md) for the full map, and
[`PLATFORM_ARCHITECTURE.md`](../ERPSys/docs/PLATFORM_ARCHITECTURE.md) § 4.2 for
the reasoning.

## Licence

AGPL-3.0.
