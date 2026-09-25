# Local project page skeleton

The final project title is intentionally unset. After confirmation, edit only `siteConfig.projectTitle` near the top of `dist/script.js`.

All current media areas are neutral gray placeholders. They do not represent experimental inputs, outputs, metrics, or conclusions.

## Start locally

From this directory, run:

```powershell
py -m http.server 8000 --directory dist
```

Then open <http://localhost:8000>.

If `py` is unavailable, use:

```powershell
python -m http.server 8000 --directory dist
```

## Structure

```text
dist/
  index.html
  style.css
  script.js
  assets/
    images/
```

The empty `assets/images/` directory is reserved for verified project media supplied later.
