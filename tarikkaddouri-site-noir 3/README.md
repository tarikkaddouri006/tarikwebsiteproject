# tarikkaddouri.com — The Darkroom

Static site, no build step. Deploy to Netlify by dragging this whole folder onto
app.netlify.com/drop, or connect a repo with publish directory "." (netlify.toml is set).

## Photographs
The roll is pulled from your Drive (STOURI asset library, Columbia selects, TK Website): 14 frames, photos and clips, shown in black and white.

## Add your photographs
1. Put black-and-white JPGs in /images (about 2000px on the long side, under 500KB each).
2. Open images.js and list them in order: darkest first, lightest last.
   Rhythm: you, place, object, person, then repeat.
3. Set place and year for each. Use fit: "contain" for images that must not be cropped.
4. Delete sample-1.jpg / sample-2.jpg (tux shirt test shots) when you're done.
Any listed file that is missing shows as a dark "[ frame 07 ]" placeholder.

## How it behaves
- Opens on black; a single beam switches on and lights your name, projected on the floor.
- The light is a stage fixture hung above the page: it lags, swings and settles as you move.
- Scroll widens or narrows the beam (readout shows beam angle and colour temperature).
- Press and hold to focus: the beam tightens, brightens, and its ring of points sharpens.
- Haze drifts through the beam; light runs warm tungsten at night and cools toward the last frame.
- The cursor is the blue dot. Only what the beam falls on is visible.
- Click (or arrow keys / swipe) to develop the next frame from black.
- The room gets lighter through the roll; the last frame opens the About window.
- Spec marks (crosshairs, frame number, place, year) flicker in on each frame and when the cursor rests.
- About and Contact open as windows: draggable, close back into the dot.

## Edit text
About copy and contact details are in index.html.
