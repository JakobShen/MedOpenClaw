# MedOpenClaw website

This is a lightweight static website designed for GitHub Pages.

## Structure

- `index.html` — the whole page
- `static/css/index.css` — styling
- `static/js/index.js` — reveal animations, BibTeX copy button, automatic video detection
- `static/images/` — logo and paper figures
- `static/videos/` — put your demo videos here

## Add your videos

Recommended:

- `static/videos/demo1.mp4`
- `static/videos/demo2.mp4`
- `static/videos/demo3.mp4`
- `static/videos/demo4.mp4`

Optional combined reel:

- `static/videos/demo1234.mp4`

Fallback names supported by the page:

- `demo1.mov`
- `demo2.mov`
- `demo3.mov`
- `demo4.mov`
- `demo1234.mov`

For best browser compatibility, use MP4 (H.264/AAC).

## Deploy on GitHub Pages

1. Create a GitHub repository, for example `MedOpenClaw`.
2. Upload all files from this folder to the repository root.
3. Put your videos into `static/videos/`.
4. Commit and push.
5. On GitHub, open **Settings** → **Pages**.
6. Under **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main`
   - **Folder**: `/(root)`
7. Save.
8. Your site will appear at:
   - `https://<your-username>.github.io/MedOpenClaw/`

## Notes

- This site uses relative paths, so it works for normal GitHub project pages.
- `.nojekyll` is included so GitHub Pages serves the site directly as a static page.
- If you want to change demo titles or descriptions, edit `index.html`.
