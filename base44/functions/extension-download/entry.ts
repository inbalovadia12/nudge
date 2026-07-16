import { createClientFromRequest } from 'npm:@base44/sdk@0.8.39';
import JSZip from 'npm:jszip@3.10.1';

const ICON_URL = 'https://media.base44.com/images/public/6a3ae5c0253dd0bc3229da04/fe0ce1d8e_generated_image.png';
const FALLBACK_ORIGIN = 'https://nudigofinance.base44.app';

const EXTENSION_FILES = [
  'manifest.json',
  'background.js',
  'content.js',
  'popup.html',
  'popup.js',
  'popup.css',
  'block.html',
  'block.js',
  'block.css',
  'intervention.html',
  'intervention.js',
  'intervention.css',
  'options.html',
  'options.js',
  'options.css'
];

const README_CONTENT = `Nudigo Shopping Shield — Chrome Extension v2.0.0

INSTALLATION:
1. Extract this ZIP file to a permanent location on your computer
2. Open Chrome and go to chrome://extensions/
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked" and select the extracted folder
5. Pin the extension to your toolbar for easy access

CONNECTING TO NUDIGO:
1. Click the Nudigo shield icon in your Chrome toolbar
2. Click "Connect to Nudigo"
3. Sign in to your Nudigo account in the tab that opens
4. Your blocklist and financial data will sync automatically

FEATURES:
- Block shopping sites completely or show intervention questions
- Manage your blocklist from the extension or the Nudigo web app
- AI Assistant: ask "Can I afford this?" while browsing
- Screenshot analysis: capture the current page for AI-powered advice
- Changes sync instantly across the extension and web app

NEED HELP?
Visit https://nudigofinance.base44.app or contact support from the app.
`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const profiles = await base44.entities.UserProfile.list();
    const profile = profiles[0];

    if (!profile || !['plus', 'pro'].includes(profile.plan_type)) {
      return Response.json({ error: 'Premium subscription required' }, { status: 403 });
    }

    const rawOrigin = req.headers.get('Origin') || FALLBACK_ORIGIN;
    const origin = rawOrigin.startsWith('http://localhost') ? FALLBACK_ORIGIN : rawOrigin;

    // Create ZIP
    const zip = new JSZip();

    // Fetch and add all extension files
    for (const file of EXTENSION_FILES) {
      const response = await fetch(`${origin}/extension/${file}`);
      if (!response.ok) {
        console.error(`Failed to fetch ${file}: ${response.status}`);
        return Response.json({ error: `Failed to package extension file: ${file}` }, { status: 500 });
      }
      const content = await response.text();
      zip.file(file, content);
    }

    // Add README
    zip.file('README.txt', README_CONTENT);

    // Fetch and add icon
    try {
      const iconResponse = await fetch(ICON_URL);
      if (iconResponse.ok) {
        const iconBuffer = await iconResponse.arrayBuffer();
        const iconFolder = zip.folder('icons');
        iconFolder.file('icon128.png', iconBuffer);
        iconFolder.file('icon16.png', iconBuffer);
      }
    } catch (err) {
      console.error('Icon fetch failed:', err);
      // Continue without icon — extension will use default
    }

    // Generate ZIP
    const zipData = await zip.generateAsync({ type: 'uint8array' });
    const file = new File([zipData], 'nudigo-extension-v2.zip', { type: 'application/zip' });

    // Upload
    const result = await base44.integrations.Core.UploadFile({ file });

    return Response.json({ download_url: result.file_url, version: '2.0.0' });
  } catch (error) {
    console.error('extension-download error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});