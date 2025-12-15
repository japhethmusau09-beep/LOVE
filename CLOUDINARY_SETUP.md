# Cloudinary setup (unsigned uploads)

This project supports optional client-side photo uploads to Cloudinary. To enable photo uploads:

1. Create a Cloudinary account at https://cloudinary.com/. Note your cloud name.
2. In the Cloudinary dashboard, go to Settings -> Upload, create an unsigned upload preset, allow unsigned uploads and note the preset name.
3. Copy `config.example.json` to `config.json` at the repository root and set `cloud_name` and `unsigned_upload_preset` to the values from your Cloudinary dashboard.
   - Example `config.json`:
   {
     "cloud_name": "my-cloud",
     "unsigned_upload_preset": "unsigned_preset"
   }
4. Ensure `config.json` is deployed alongside `index.html` (it must be accessible at `/config.json`). Do NOT commit secrets or private presets to public repos.

Behavior:
- If `config.json` exists and is valid, selected photos will be compressed client-side and uploaded to Cloudinary; the resulting secure URLs will be included in the generated shared link so recipients can view the photos.
- If `config.json` is missing, the app will still work but photos will not be uploaded or included in the share link; only local previews will be available.

Security:
- Use unsigned uploads only when you understand the risks (anyone can upload to that preset). For more control, implement a server-side signed upload flow.


---
