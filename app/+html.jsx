import { ScrollViewStyleReset } from 'expo-router/html';
import { BOOT_LOADER } from '../constants/boot-loader';

/**
 * Blocking script — reads persisted colorScheme before first paint to avoid light flash.
 * Keep bg hex in sync with constants/palette.js P.light.bg / P.dark.bg.
 */
const THEME_BOOT_SCRIPT = `
(function () {
  try {
    var raw = localStorage.getItem('beaverr_ui_preferences');
    var mode = 'light';
    if (raw) {
      var prefs = JSON.parse(raw);
      if (prefs && prefs.colorScheme === 'dark') mode = 'dark';
    }
    var root = document.documentElement;
    root.dataset.colorScheme = mode;
    root.classList.toggle('dark', mode === 'dark');
    root.style.colorScheme = mode;
    var bg = mode === 'dark' ? '#0B1220' : '#EFF4FB';
    root.style.backgroundColor = bg;
    if (document.body) document.body.style.backgroundColor = bg;
    var loader = document.getElementById('app-boot-loader');
    if (loader) loader.style.backgroundColor = bg;
  } catch (e) {}
})();
`;

/**
 * Static boot loader CSS — mirrors components/app/AppLoadingScreen.jsx.
 * Runs before JavaScript on web; keep tokens in sync via lib/bootLoader.js.
 */
const BOOT_LOADER_CSS = `
#app-boot-loader {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${BOOT_LOADER.bg};
  transition: opacity 0.4s ease;
}

#app-boot-loader.app-boot-loader--hide {
  opacity: 0;
  pointer-events: none;
}

.beaver-boot {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
}

.beaver-boot__spinner {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 3px solid rgba(59, 130, 246, 0.22);
  border-top-color: ${BOOT_LOADER.accent};
  animation: beaver-boot-spin 0.9s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .beaver-boot__spinner {
    animation: none;
  }
}

@keyframes beaver-boot-spin {
  to {
    transform: rotate(360deg);
  }
}
`;

export default function Root({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="application-name" content="Beaverr" />
        <title>Beaverr</title>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <ScrollViewStyleReset />
        <style
          id="beaver-viewport-css"
          dangerouslySetInnerHTML={{
            __html: `
html, body, #root {
  height: 100%;
  overflow: hidden;
}
`,
          }}
        />
        <style id="beaver-boot-loader-css" dangerouslySetInnerHTML={{ __html: BOOT_LOADER_CSS }} />
      </head>
      <body>
        <div id="app-boot-loader" role="status" aria-live="polite" aria-label="Loading">
          <div className="beaver-boot">
            <div className="beaver-boot__spinner" aria-hidden="true" />
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
