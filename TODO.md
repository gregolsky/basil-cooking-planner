# TODO

## Bugs

- Good catch — this is a bug. dayModifiers are stored globally in the Zustand store, not per-plan. So the difficultyCap: 2 you set on April 30th for your previous plan silently carries over when you create a new plan that includes that date. The same issue affects cumulativeLimits — also global. FIX: Move dayModifiers (and cumulativeLimits) inside the Plan type — each plan owns its own modifiers. Most correct, but involves a schema migration.                                                          

## UX / Onboarding
- [ ] More contextual help descriptions throughout the app (tooltips or inline hints explaining fields, constraints, tag limits, difficulty scale, etc.)
