# Interview notes

## Terms so far

### Paid API (future)
- **API key vs user token:** an API key identifies the customer's app; a user token identifies one person signed in to it.
- **Quota vs rate limit:** a quota is how much a customer may use per period (set by their plan); a rate limit is how fast they may call.
- **Usage metering:** counting every call per customer so we can bill them and enforce their quota.
- **API versioning:** keeping a fixed response shape under a version (like `/v1/`) so our changes don't break customers' apps.
- **Single source of truth:** one additive table on the server, so the app and the API can never give different answers.

### Additive accordion scroll (commit 3d0e228)
- **React Context vs prop drilling:** Context lets any child read a shared value (here `Screen`'s ScrollView ref via `useScreenScroll()`) without passing it down through every component's props.
- **`useRef` vs `useState`:** changing a ref does not re-render the component; changing state does.
- **Ref callback with cleanup (React 19):** a ref callback can return a cleanup function that React runs when the element goes away.
- **`useLayoutEffect` vs `useEffect`:** `useLayoutEffect` runs after layout but before the screen is painted, so we can measure and scroll without a visible jump; `useEffect` runs after paint.
- **`measureLayout`:** gives a view's position relative to another view (the scroll content), not relative to the phone screen.
- **Component type vs instance type:** `ScrollView` is the component; a ref holds an instance, typed `ScrollViewInstance` / `HostInstance` in RN 0.88.
- **Keep CLAUDE.md current:** a stale note misleads the next session, so update it in the same step as the code.
- **Stage files by name; `git commit -F`:** `git add <file>` avoids committing things by accident; `-F` reads the commit message from a file, which avoids PowerShell quoting problems with multi-line messages.
- **`git status -sb`:** short status plus a branch line showing how many commits you are ahead of or behind the remote.

### Git on Windows
- **Line endings (LF vs CRLF, `core.autocrlf`):** Unix ends lines with LF, Windows with CRLF; with `core.autocrlf=true` Git stores LF in the repo and gives you CRLF in your working folder (a `.gitattributes` file can fix this per repo for everyone).
