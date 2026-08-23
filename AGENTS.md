# Assets

- Whenever an image asset is first introduced, replaced, or downloaded again, trim its transparent padding using an alpha threshold of 1 before using it.
- After trimming, convert PNG assets to WebP or SVG and use the converted output in the project.
- When applying visual effects such as outlines, glows, or shadows to PNG, WebP, or other image assets that may contain transparent padding, do not use the asset's rectangular display box as the effect boundary. Instead, create a separate effect object that shares the same center as the asset, and size or shape it to match the asset's actual visible content. Effects must visually follow the rendered artwork rather than the transparent bounds of the source image.

# Commands

- Before running a project command, inspect the `scripts` field in `package.json` and choose an existing script. Run it with `pnpm run <script>`. Before passing CLI options to the script, verify those options against both the script definition and the underlying command's supported options.

# Imports

- In module specifiers resolved by Vite, use the `@` alias instead of relative paths. A relative module specifier is permitted only when it starts with `../` and contains exactly one `..` path segment; `./...` and paths containing two or more `..` segments are prohibited.
