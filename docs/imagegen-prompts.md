# ImageGen production prompts

Generated on 2026-10-10 with the built-in OpenAI ImageGen tool (no API key or external paid asset provider). PNG originals are in `art/source`; the game consumes WebP versions in `public/assets`. The attached reference was used for visual direction, not shipped as a UI screenshot. The final atlas has a genuine alpha channel and fixed 512 px tiles.

## Title background

```text
Use case: illustration-story
Asset type: premium portrait title background for a cozy Japanese Halloween browser strategy game called TRICK OR DETOUR.
Primary request: Create a detailed hand-painted storybook illustration, portrait aspect ratio 2:3. A winding woodland footpath through a magical Halloween forest, cozy purple-roofed witch cottage with amber glowing windows in the middle-right distance, charming little costumed children (white sheet ghost, purple witch, green Frankenstein) walking along the path at bottom, wooden arrow signs, pumpkins and warm hanging lanterns, black cat, tiny floating friendly ghosts, deep navy and forest teal shadows, rich orange amber glow, muted lavender accents. Large golden harvest moon in upper-right sky with distant castle silhouettes and little bats. Painterly exquisite quality, soft textured edges, whimsical inviting atmosphere, no horror.
Composition: Reserve upper-left quarter as darker mostly open night sky for a title overlay. Cottage on right, path leads from lower center to cottage, beautiful layered forest depth. No UI, no lettering, no words, no borders, no watermark. This is scenery that will sit behind separate live HTML interface. Do not draw buttons or title.
```

## Forest board

```text
Use case: stylized-concept
Asset type: portrait 2:3 top-down 2D woodland game board background, no UI or paths.
Primary request: A beautifully hand-painted cozy Halloween forest clearing seen from directly above. Deep teal and dark green forest floor covered in very subtle moss and tiny scattered muted autumn leaves. Dense pine trees, leafy canopies, ferns, tiny orange pumpkins and mushrooms frame ONLY the far outer edges and corners. Soft pools of amber lantern light near the left and right outer edges. Very subtle purple-blue moonlight. Clean readable empty moss clearing occupies the central 75% of the image so live golden pathways, signs and characters can be placed there in code. Watercolor and gouache storybook texture, premium charming game art, muted low contrast center, lively detailed edges. Entire scene orthographic overhead, no horizon, no sky, no people, no buildings, no characters, no paths, no roads, no text, no interface, no icons, no borders, no watermark. Keep center calm and open.
```

## Original atlas

```text
Use case: stylized-concept
Asset type: transparent game sprite atlas, 3 columns by 2 rows, landscape aspect 3:2, each equal cell with centered separate isolated object and generous padding. Genuine alpha transparent background.
Primary request: Six charming hand-painted storybook Halloween game sprites, cozy warm amber highlights, lavender and deep forest colors, crisp dark outlines readable at tiny scale, softly shaded chibi illustration, unified art direction. EXACT grid order:
TOP LEFT: happy little child in a white sheet ghost costume, face visible, orange candy bucket, full body, three-quarter front view.
TOP MIDDLE: happy little child wearing a tall purple witch hat and lavender dress with orange candy bucket, full body, three-quarter front view.
TOP RIGHT: cheeky child in green Frankenstein costume with bolt ears and charcoal clothes, orange bucket, full body, three-quarter front view.
BOTTOM LEFT: cozy little crooked witch cottage, tall purple roof, amber glowing windows and round wooden door, stone foundation, pumpkins, slight overhead three-quarter front view.
BOTTOM MIDDLE: one friendly floating white ghost with rosy cheeks, rounded flowing shape, cute surprised expression.
BOTTOM RIGHT: one large glowing orange jack-o-lantern with a little crooked stalk, cheerful carved face and green leaves.
Composition: 3x2 precisely uniform grid, one item per tile, fully contained, no object extends outside its own cell, NO grid lines, NO labels, NO text, NO ground/background, NO watermark. Each object fully visible and centered in its tile; children fill about 72% of tile height, house fills 80%. Preserve transparent pixels between all sprites.
```

## Final atlas edit

```text
Edit target: the existing six-sprite 3 by 2 transparent Halloween game atlas.
Change ONLY the packing/padding: preserve the beautiful painted style, colors and identity of all six objects. Make each object smaller within its assigned tile so there is at least 50 pixels of completely transparent padding on ALL four sides within each 512x512 tile. None of the sprites or their glows may cross any tile boundary. Remove residual colored background halos. Maintain a true alpha transparent background.
Output MUST remain 1536x1024 pixels (3 columns, 2 rows of equal 512 pixel tiles), exactly six separate sprites: top row white ghost-costume child, purple witch child, green Frankenstein child. Bottom row purple-roof witch cottage, friendly white floating ghost, jack-o-lantern. Exact same grid order and style. No added text or lines. Treat each entire item as a self-contained cutout with ample uniform transparent margins; use max 400x400 bounding boxes per tile centered in that tile. Never overlap adjacent tiles.
```
