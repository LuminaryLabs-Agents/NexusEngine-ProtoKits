# ProtoKit Map

This file tracks current and target reusable kits.

## Standing constraints

- Reusable kit implementation changes should be pushed only to ProtoKits.
- ProtoKits should define domain communication boundaries through resources, events, methods, snapshots, and descriptors.
- Experiments should consume ProtoKits instead of owning reusable gameplay logic.
- When multiple kits combine, look for a higher-level domain above them.

## Current map

Scheduled tasks should keep this file current by recording:

- Existing atomic kits.
- Existing composite kits.
- Candidate higher-level domains.
- Experiment consumers.
- Headless test coverage.
- Promotion readiness.

## Target direction

Move toward composable DSK-style kits that let hosts stay close to import/configure/tick/render.
