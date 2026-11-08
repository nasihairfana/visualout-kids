# Security policy

Visualout Kids is a static, offline-first web app for young children. It has no accounts, no server
and no analytics, and it stores only a few settings in the browser. We still take security and
child safety seriously.

## Reporting a problem

Please **don't open a public issue** for a security or child-safety problem. Instead, either:

- use GitHub's [private vulnerability reporting](https://github.com/nasihairfana/visualout-kids/security/advisories/new), or
- email **team@visualout.com**.

Things we especially want to hear about:

- anything that lets a child leave the app, or reach an outside link without the parent gate
- anything that sends data off the device, or loads code or media from another site
- weaknesses in the Content-Security-Policy or other headers written by `scripts/postbuild.mjs`

We aim to reply within 7 days. Only the latest version at
[kids.visualout.com](https://kids.visualout.com) is supported.
