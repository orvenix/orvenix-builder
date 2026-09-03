# Dependency Audit Exceptions

## Auth.js v4 residual npm audit finding

Date: 2026-09-03

Orvenix Builder uses `next-auth` 4.24.15 as the official security patch line for NextAuth.js v4, together with `@auth/prisma-adapter` 2.11.3.

`npm audit` still attributes a critical finding to `next-auth` because `next-auth` 4.24.15 declares the optional peer dependency `@auth/core` 0.34.3. This project accepts that residual finding for the current configuration because:

- The application does not import `@auth/core` directly.
- Executable JavaScript inside `next-auth` does not import the optional `@auth/core` peer.
- `CredentialsProvider` is the only configured provider.
- The application does not use `EmailProvider`, magic links, OAuth/OIDC providers, or account linking.
- `getToken` from `next-auth/jwt` was tested with an invalid percent-encoded Bearer token and returned `null` instead of throwing.
- `@auth/prisma-adapter` 2.11.3 resolves its own `@auth/core` 0.41.3 dependency.

No override is used because there is no officially demonstrated compatibility contract for forcing `next-auth` v4 to use `@auth/core` 0.41.3 as its peer.

Residual Auth.js advisories reported through the optional peer:

- `next-auth`: critical direct dependency, reported via `@auth/core`.
- `@auth/core`: critical transitive optional peer installed at 0.34.3 for `next-auth`.
- `@auth/prisma-adapter`: not reported by `npm audit --omit=dev`; it resolves `@auth/core` 0.41.3.
- GHSA-7rqj-j65f-68wh: Auth.js email normalizer validates before Unicode normalization.
- GHSA-xmf8-cvqr-rfgj: Auth.js `getToken()` malformed Bearer header exception.
- GHSA-x445-f3h2-j279: Auth.js OAuth state, nonce, and PKCE cookies not bound to provider.

Official advisory links:

- https://github.com/advisories/GHSA-7rqj-j65f-68wh
- https://github.com/advisories/GHSA-xmf8-cvqr-rfgj
- https://github.com/advisories/GHSA-x445-f3h2-j279

Reopen this exception before adding any of the following:

- `EmailProvider` or magic links.
- OAuth/OIDC providers.
- Account linking.
- Direct imports from `@auth/core`.

Reexamine this exception when another stable security patch for `next-auth` v4 becomes available.
