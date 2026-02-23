# Vite Migration Guide

## What Changed

### ✅ Already Done
- `vite.config.js` created with React plugin
- `index.html` moved to root (Vite entry point)
- `src/main.jsx` created (replaces `src/index.js`)
- `package.json` updated with Vite scripts and dependencies
- Environment variables updated from `REACT_APP_*` to `VITE_*`
- `.gitignore` updated for Vite output (`/dist`)

### 🔧 Next Steps

1. **Clean install dependencies:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```
   - Dev server runs on `http://localhost:3000`
   - Hot Module Replacement (HMR) enabled by default

3. **Build for production:**
   ```bash
   npm run build
   ```
   - Output goes to `/dist` folder
   - Ready to deploy

4. **Preview production build locally:**
   ```bash
   npm run preview
   ```

## Key Differences from CRA

| Feature | CRA | Vite |
|---------|-----|------|
| Dev Server | Slow (webpack) | Fast (native ESM) |
| Build Tool | Webpack | Rollup |
| Entry Point | `src/index.js` | `index.html` at root |
| Env Variables | `REACT_APP_*` | `VITE_*` |
| Output Folder | `/build` | `/dist` |
| Config File | None (hidden) | `vite.config.js` |

## Environment Variables

In your code, access Vite env vars like this:

```javascript
// Old (CRA)
const apiUrl = process.env.REACT_APP_API_URL;

// New (Vite)
const apiUrl = import.meta.env.VITE_API_URL;
```

Your API service already uses a proxy, so no changes needed there.

## Deployment

### Netlify
Update your build settings:
- **Build command:** `npm run build`
- **Publish directory:** `dist`

### Vercel
Update your build settings:
- **Build command:** `npm run build`
- **Output directory:** `dist`

### Other Platforms
Change build output from `/build` to `/dist`

## Troubleshooting

**Issue: "Cannot find module" errors**
- Make sure you're using `.jsx` extension for React components
- Vite requires explicit file extensions in imports

**Issue: Environment variables not loading**
- Restart dev server after changing `.env` file
- Use `import.meta.env.VITE_*` not `process.env.REACT_APP_*`

**Issue: API calls failing**
- Check `vite.config.js` proxy settings
- Ensure `VITE_API_URL` is set in `.env`

## What You Can Delete

After confirming everything works:
- `src/index.js` (replaced by `src/main.jsx`)
- `public/index.html` (replaced by root `index.html`)
- Any CRA-specific files

## Performance Gains

- Dev server startup: ~10x faster
- HMR updates: Near-instant
- Build time: ~2-3x faster
- Bundle size: Smaller due to better tree-shaking
