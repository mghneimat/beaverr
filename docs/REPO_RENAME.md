# Repository rename: pocket-os → beaverr

Manual steps to rename the local folder and GitHub repository after the Beaverr rebrand.

## 1. Commit and push current work

Ensure all local changes are committed and pushed to the remote before renaming.

## 2. Rename the GitHub repository

1. Open the repo on GitHub → **Settings** → **General**.
2. Under **Repository name**, change `pocket-os` to `beaverr`.
3. Click **Rename**.

GitHub redirects the old URL temporarily; update remotes anyway (step 4).

## 3. Rename the local folder

Close editors/terminals using the old path, then:

**Windows (PowerShell):**

```powershell
cd C:\Users\momen
Rename-Item -Path pocket-os -NewName beaverr
```

**macOS / Linux:**

```bash
cd ~
mv pocket-os beaverr
```

## 4. Update git remote URL

```powershell
cd C:\Users\momen\beaverr
git remote -v
git remote set-url origin https://github.com/<YOUR_ORG_OR_USER>/beaverr.git
git remote -v
git fetch origin
```

Replace `<YOUR_ORG_OR_USER>` with your GitHub username or organisation.

## 5. Re-open the project in your editor

- **Cursor / VS Code:** File → Open Folder → `C:\Users\momen\beaverr`
- Update any workspace files, shortcuts, or CI paths that still reference `pocket-os`

## 6. Verify

```powershell
cd C:\Users\momen\beaverr
npm install
npm run web
npm test
```

## 7. Optional follow-ups

- Update Vercel / Expo EAS / other deploy hooks to the new repo name and folder path
- Search the machine for stale `pocket-os` paths in scripts, env files, or documentation bookmarks
- Notify collaborators to re-clone or update their remote URL
