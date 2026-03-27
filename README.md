# MedOpenClaw website

Static GitHub Pages project page for **MedOpenClaw**.

## Structure

- `index.html` — page content
- `static/css/index.css` — styling
- `static/js/index.js` — BibTeX copy button and robust video loading/autoplay
- `static/images/` — logo and figures
- `static/videos/` — demo videos
- `.nojekyll` — disables Jekyll processing on GitHub Pages

## Video filenames

Put the videos in `static/videos/` using these base names:

- `demo1` — Brain Tumor Localization and Differentiation
- `demo2` — Longitudinal Analysis of Tumor Size
- `demo3` — Adjust to the Most Informative Tumor View
- `demo4` — Failure Case: Segmentation Failure

Supported extensions in the page loader:

- `.mp4`
- `.MP4`
- `.mov`
- `.MOV`
- `.webm`
- `.WEBM`

Recommended for web playback: **H.264 MP4**.

## Deploy on GitHub Pages

1. Upload all files in this folder to the repository root.
2. Put the demo videos into `static/videos/`.
3. In GitHub, open **Settings → Pages**.
4. Set:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main`
   - **Folder**: `/(root)`
5. Save.

Your site will be published at:

`https://<your-username>.github.io/MedOpenClaw/`
