# cine-swipe documentation

Documentation contract: **GitPageDocs 0.0.17**. Application documentation version: **1.0.0**.

The existing Pages workflow builds the viewer from tag `v0.0.17`; publishing requires a push or an explicit workflow dispatch.

The root configuration retains project identity, theme and version history. Official layout assets are pinned to `v0.0.17`. Markdown, route catalogs and interface strings remain in this folder.

## Reading and editing

- Start with [project context](docs/versions/1.0.0/pt/project-guide.md) or the [English guide](docs/versions/1.0.0/en/project-guide.md).
- Check [source reference](docs/versions/1.0.0/pt/source-reference.md) for declared dependencies, scripts, API routes and configuration names.
- Keep Portuguese, English and Spanish routes synchronized in `docs/versions/1.0.0/config.json`.
- Validate JSON, Markdown links and route destinations before publishing. Never copy private environment files into documentation.

## Toolchain

Node.js 20 or later. Inspect the exact CLI version without regenerating project content:

```sh
npx --yes --package @gitpagedocs/cli@0.0.17 gitpagedocs version
```

The generic scaffold is a template, not an updater for project-specific prose. Review and merge defaults explicitly. `--push`, `deploy` and `pages deploy` publish changes and are outside this local editing workflow.

Runtime documentation: [GitPageDocs v0.0.17](https://github.com/Vidigal-code/git-page-docs/blob/v0.0.17/cli/README.md).
