# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | Yes       |

Scribetronic is pre-1.0. Only the latest minor receives fixes.

## Reporting a Vulnerability

If you find a security issue, **do not open a public issue**.

Use GitHub's private security advisory flow:

1. Go to https://github.com/r-bart/scribetronic/security/advisories/new
2. Describe the issue with reproduction steps and impact.
3. Allow up to 14 days for an initial response.

Scope notes:

- Scribetronic is a CLI that copies template files into a target directory. The main classes of issues we care about are: path traversal in `init`, arbitrary command execution via the editor launcher in `style`, and template content that could exfiltrate data when interpreted by an AI agent.
- Out of scope: vulnerabilities in transitive dependencies that have no realistic exploit path through scribetronic's own surface.

We will credit reporters in the CHANGELOG when an advisory is published, unless the reporter prefers anonymity.
