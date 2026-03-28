# Security Plan (Deferred)

## Purpose
This document captures security hardening work to complete at a later date.
Current priority is feature expansion for the health-tracking roadmap.

## Status
- Execution: Deferred
- Owner: TBD
- Target start: After initial health features are stable

## Guiding Principles
- Keep user-facing error messages safe and non-sensitive.
- Enforce least-privilege access on every endpoint.
- Remove insecure defaults from production paths.
- Add tests for every security-sensitive flow.

## Priority Backlog

### P0: Authentication and Account Recovery
1. Replace password reset implementation with token-based flow.
- Create secure reset token generation and hashing.
- Store token hash and expiry in the users table.
- Verify token and expiry before allowing password changes.
- Invalidate token after successful reset.

2. Prevent account enumeration in forgot/reset flows.
- Return the same generic response whether a user exists or not.
- Avoid revealing account existence via status code or message.

3. Remove fallback JWT secret in production.
- Fail startup when JWT_SECRET is missing outside development.
- Ensure token signing and verification use the same required secret.

### P0: Authorization and Data Exposure
1. Lock down user listing and create-user endpoints.
- Remove public GET /users for non-admin users.
- Remove or restrict POST /users path that bypasses auth registration flow.

2. Audit route-level ownership checks.
- Ensure every user-scoped route validates owner identity.
- Add regression tests for forbidden cross-user access.

### P1: API Hardening
1. Sanitize backend error responses.
- Replace raw error.message returns with generic server errors.
- Log internal details server-side only.

2. Restrict CORS in production.
- Allow only known frontend origins.
- Keep permissive CORS only for local development.

3. Add request throttling/rate limiting.
- Apply stricter limits on auth endpoints.
- Add moderate limits for write-heavy tracking endpoints.

### P1: Input and Payload Controls
1. Add centralized validation middleware.
- Validate date formats, metric ranges, and enum-like values consistently.
- Reject unknown/unexpected fields where appropriate.

2. Enforce payload limits.
- Set max request body size.
- Validate avatar and any media inputs with strict limits.

### P2: Observability and Operations
1. Structured audit logs for security events.
- Login success/failure, password change, reset attempt, token invalidation.

2. Security headers and baseline protections.
- Add helmet and secure header defaults.
- Verify cookie/token transport security for deployment model.

3. Secrets and environment hygiene.
- Document required env vars for each environment.
- Rotate secrets on schedule and after incidents.

## Test Plan (When Implementing)
- Unit tests for reset token generation/verification and expiry logic.
- Integration tests for auth failure paths and unauthorized access.
- Cypress/API tests for password reset and cross-user access prevention.
- Negative tests for malformed payloads and oversized requests.

## Suggested Implementation Order
1. Password reset token flow + anti-enumeration behavior.
2. JWT secret enforcement and startup validation.
3. User endpoint access restrictions.
4. Error response sanitization and CORS restrictions.
5. Rate limits and centralized validation middleware.
6. Logging, headers, and operational hardening.

## Definition of Done
- No insecure auth fallback remains in production configuration.
- Password reset requires a valid, unexpired token.
- User enumeration is not possible through auth endpoints.
- User data exposure routes are removed or role-restricted.
- Security regression tests pass in CI.
- Deployment docs include required secure env configuration.

## Out of Scope for This Phase
- Immediate implementation of tasks in this document.
- Full role-based access control model redesign.
- Third-party security tooling migration.

## Notes
- This plan is intentionally deferred while new health-tracking features are built.
- Revisit and schedule before production release of major health features.
