# cine-swipe documentation

Documentation contract: **GitPageDocs 0.0.30**. Application documentation version: **1.0.0**.

The existing Pages workflow builds the viewer from tag `v0.0.30`; publishing requires a push or an explicit workflow dispatch.

The root configuration retains project identity, theme and version history. Official layout assets are pinned to `v0.0.30`. Markdown, route catalogs and interface strings remain in this folder.

## Reading and editing

- Start with [project context](docs/versions/1.0.0/pt/project-guide.md) or the [English guide](docs/versions/1.0.0/en/project-guide.md).
- Check [source reference](docs/versions/1.0.0/pt/source-reference.md) for declared dependencies, scripts, API routes and configuration names.
- Keep Portuguese, English and Spanish routes synchronized in `docs/versions/1.0.0/config.json`.
- Validate JSON, Markdown links and route destinations before publishing. Never copy private environment files into documentation.

## Toolchain

Node.js 20 or later. Inspect the exact CLI version without regenerating project content:

```sh
npx --yes --package @gitpagedocs/cli@0.0.30 gitpagedocs version
```

The generic scaffold is a template, not an updater for project-specific prose. Review and merge defaults explicitly. `--push`, `deploy` and `pages deploy` publish changes and are outside this local editing workflow.

Runtime documentation: [GitPageDocs v0.0.30](https://github.com/Vidigal-code/git-page-docs/blob/v0.0.30/cli/README.md).

## Fixed theme family and light/dark mode

`HideThemeSelector: true` hides the full theme picker and keeps the family selected by `ThemeDefault`. It still allows light/dark switching when that family has a valid pair. A different theme from the URL or browser storage cannot replace the fixed family.

`ThemeModeDefault` is the initial fallback. A valid mode from `modetheme=light` or `modetheme=dark` in the URL, a saved mode, or the reader’s toggle can select light/dark within that family. The selected mode survives reloads and document navigation. On narrow screens, open Menu to reach the standard control. Without a valid pair, the control is omitted.

Both entries in the layout catalog must enable `supportsLightAndDarkModes`, share the same nonempty `supportsLightAndDarkModesReference`, and declare opposite `mode` values (`light` and `dark`). This project uses the official paired catalog; keep its family and preferences when updating runtime or layout pins.
