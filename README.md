# MedOpenClaw Website

This package is a refactored GitHub Pages site with a layout and media setup closer to the K2Sight-style academic project page.

## Structure

- `index.html`
- `static/css/index.css`
- `static/js/index.js`
- `static/images/`
- `static/videos/`

## Video placement

Preferred layout:

- `static/videos/demo1.mp4`
- `static/videos/demo2.mp4`
- `static/videos/demo3.mp4`
- `static/videos/demo4.mp4`

This version also includes native HTML `<source>` fallbacks for:

- `assets/videos/demo1.mp4` ... `demo4.mp4`
- repo-root `demo1.mp4` ... `demo4.mp4`

So if you already uploaded videos under the old `assets/videos/` folder, the page can still find them.

## Deploy on GitHub Pages

1. Create or open your GitHub repository.
2. Replace the old website files with the contents of this zip.
3. Commit and push to the `main` branch.
4. In GitHub, go to `Settings -> Pages`.
5. Under `Build and deployment`, choose:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main`
   - `Folder`: `/ (root)`
6. Save and wait for GitHub Pages to publish.

Your site URL will be:

`https://YOUR_USERNAME.github.io/REPO_NAME/`

## Important note about videos

If a video appears to load but still does not actually play, the remaining problem is usually the video codec rather than the website code.

For the most reliable browser playback, re-encode to H.264 MP4. Example:

```bash
ffmpeg -i demo1.mov -c:v libx264 -pix_fmt yuv420p -movflags +faststart -an demo1.mp4
```

If your video has audio and you want to keep it:

```bash
ffmpeg -i demo1.mov -c:v libx264 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k demo1.mp4
```
