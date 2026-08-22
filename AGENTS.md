# Assets

- When applying visual effects such as outlines, glows, or shadows to PNG, WebP, or other image assets that may contain transparent padding, do not use the asset's rectangular display box as the effect boundary. Instead, create a separate effect object that shares the same center as the asset, and size or shape it to match the asset's actual visible content. Effects must visually follow the rendered artwork rather than the transparent bounds of the source image.
