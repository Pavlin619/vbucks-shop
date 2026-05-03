// Barrel export so consumers keep importing from `@/types` (per AGENTS.md).
// Domain-specific types live in sibling files; this file is intentionally
// empty of declarations to avoid a single bloated module.
export * from '@/types/profile';
export * from '@/types/purchase';
export * from '@/types/orders';
export * from '@/types/shop';
