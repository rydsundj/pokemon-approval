import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// The GitHub Pages base path is read from an env variable so the same code
// works whether the site lives at username.github.io/<repo>/ (project page)
// or on a custom domain / user page (base "/").
//
//   - Project page:  VITE_BASE_PATH=/pokemon-approval/
//   - Custom domain: VITE_BASE_PATH=/   (or leave it unset)
//
// The GitHub Actions workflow sets this automatically to "/<repo-name>/".
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    base: env.VITE_BASE_PATH || '/',
  };
});
