TK — INTERACTIVE PROTOTYPE / 01

Open index.html in Chrome, Safari, or Firefox. No server, login, installation, or external JavaScript library required. Image assets are bundled inside the file.

CONTROLS
Drag the sculpture to orbit. Scroll to zoom. Double click to reset.
Keyboard: focus the sculpture, use arrow keys, + / -, and R.
Open LINQ, STOURI, MODELING, or ARCHIVE from the dock or scene portals.
Drag window title bars. Double click a title bar to expand or restore.
Title bars also support arrow keys (Shift for larger steps).
Use gallery arrows or thumbnails. Click a photograph for the image viewer.
Escape closes the viewer or the foremost window. EXPLORE resets the scene.
Sound starts only when explicitly enabled. It is an original synthesized ambient tone.

IMAGERY
Uses original imagery from the uploaded Stouri Portfolio and these connected Google Drive folders: Jennifer Alyse Retouched, Kate Moore, COLUMBIA SELECTS.
The modeling images are Tarik's actual photographs. Photographer credits follow the source folder labels.
Portfolio images are extracted copies, so original high-resolution files can improve later versions.
This prototype uses a procedural sculpture, not a rotatable 3D model of a LINQ shoe.
Film buttons open the portfolio's existing YouTube links in a new tab.

SQUARESPACE INSTALLATION
Installation is currently blocked by the site's expired subscription.
After restoring a plan that supports JavaScript in Code Blocks:
1. Create a separate blank test page, excluded from navigation.
2. Add a Code Block in HTML mode. Paste squarespace-code-block.txt.
3. Keep display-source disabled. Save and test outside the editor, where scripts may be disabled.
4. Verify desktop and mobile interactions before replacing the homepage.
The interface uses a fixed, full-viewport root scoped to #tk-universe. It intentionally covers the normal header and footer on this test page.
If Squarespace rejects the bundled data-image size, move the selected images to Squarespace asset hosting and replace their ASSETS entries with the assigned direct URLs. The current package intentionally keeps everything together for review.
Do not paste the full index.html document into sitewide Code Injection.

VALIDATION
JavaScript syntax checked. Browser checked: original images load; gallery changes; expand/restore; image viewer; archive; world navigation; window keyboard movement; sculpture keyboard orbit; optional sound toggle.
The review browser does not expose WebGL. It uses the software 3D fallback, with actual geometry and orbit/zoom controls. WebGL renderer is included but has not been visually verified in a GPU-enabled browser.
Touch layout is implemented; physical-device testing and final Squarespace integration remain outstanding.

SOURCE
index.html is the full editable standalone source.
squarespace-code-block.txt is the matching scoped fragment for a page Code Block.
No Google Drive folder permissions or existing website content were changed.
