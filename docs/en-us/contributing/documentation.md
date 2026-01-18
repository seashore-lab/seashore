# Documentation

This repository uses mdBook for documentation.

## Structure

- Book source: `docs/`
- Table of contents: `docs/SUMMARY.md`
- mdBook config: `book.toml` (source is `docs`)

## Writing docs

- Keep pages example-driven.
- Prefer linking to `examples/src/*.ts` for runnable references.
- If a package README is empty/outdated, prefer source code + API contracts under `specs/`.

## Building the book

If you have mdBook installed:

```bash
mdbook build
```

Or serve locally:

```bash
mdbook serve
```
