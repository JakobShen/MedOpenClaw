# MedOpenClaw website

Static GitHub Pages website for the MedOpenClaw project.

## Structure

- `index.html` — the page
- `static/css/index.css` — styling
- `static/js/index.js` — BibTeX copy button
- `static/images/` — logo and paper figures
- `static/videos/` — demo videos
- `.nojekyll` — disables Jekyll processing on GitHub Pages

## Video filenames

The page supports these filenames for each demo slot:

- `demo1.mp4` / `demo1.MP4` / `demo1.mov` / `demo1.MOV`
- `demo2.mp4` / `demo2.MP4` / `demo2.mov` / `demo2.MOV`
- `demo3.mp4` / `demo3.MP4` / `demo3.mov` / `demo3.MOV`
- `demo4.mp4` / `demo4.MP4` / `demo4.mov` / `demo4.MOV`

Recommended for web playback: H.264 MP4.

## Deploy on GitHub Pages

1. Put all files from this folder in the repository root.
2. Put the four demo videos into `static/videos/`.
3. Commit and push to `main`.
4. In GitHub, open **Settings → Pages**.
5. Under **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main`
   - **Folder**: `/(root)`
6. Save.

The site URL will be:

`https://<your-username>.github.io/<repo-name>/`

## Practical note

If a MOV file does not play in some browsers, convert it to MP4 and keep the same demo number.
