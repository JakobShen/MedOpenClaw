# MedOpenClaw — GitHub Pages project site

A lightweight static project page built for **GitHub Pages**. No build step is required.

## Included content

- 4 demo video slots
- 2 static examples cropped from the paper figure
- 1 main figure section
- Direct arXiv paper link

## File structure

```text
.
├── index.html
├── .nojekyll
├── assets
│   ├── css/styles.css
│   ├── js/main.js
│   ├── images/
│   └── videos/
└── README.md
```

## Add your videos

Put the files into:

```text
assets/videos/
```

Supported naming used by the page:

- `demo1.mp4` or `demo1.mov` → Longitudinal Analysis
- `demo2.mp4` or `demo2.mov` → CT/PET Workflow
- `demo3.mp4` or `demo3.mov` → Tumor-Focused View Selection
- `demo4.mp4` or `demo4.mov` → Failure Case — Segmentation Breakdown

### Strong recommendation

Use **MP4 (H.264)** instead of MOV for better browser compatibility and smaller file size.

Example conversion with `ffmpeg`:

```bash
ffmpeg -i demo1.mov -vcodec h264 -acodec aac -movflags +faststart assets/videos/demo1.mp4
```

Repeat for `demo2`, `demo3`, `demo4`.

---

## Simplest GitHub deployment

### Option A — Use GitHub web UI only

1. Create a new GitHub repository, for example: `MedOpenClaw`.
2. Upload all files from this folder to the repository root.
3. Upload your demo videos into `assets/videos/`.
4. On GitHub, open **Settings → Pages**.
5. Under **Build and deployment**, choose:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main`
   - **Folder:** `/ (root)`
6. Click **Save**.
7. Wait about 1–3 minutes.

Your site will be available at:

```text
https://<your-github-username>.github.io/<repo-name>/
```

### Option B — Use git locally

```bash
git init
git add .
git commit -m "Initial MedOpenClaw website"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

Then enable **Settings → Pages** the same way as above.

---

## Important note about videos on GitHub Pages

GitHub Pages is fine for a small demo site, but large videos are the weak point.

Practical advice:

- Keep each video clearly below `100 MB`
- Prefer MP4 over MOV
- Compress the videos before upload
- If your videos are too large, host them elsewhere and replace the `src` paths in `index.html`

---

## Editing text

You only need to edit `index.html` for titles, captions, and links.

## Editing style

You only need to edit:

```text
assets/css/styles.css
```

## Local preview

Run a simple local server from this folder:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```
