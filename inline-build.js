import fs from 'fs';
import path from 'path';

const distDir = path.join(process.cwd(), 'dist');
const assetsDir = path.join(distDir, 'assets');

try {
  let indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

  // Find css and js files by parsing them from index.html first, then fall back
  const cssMatch = indexHtml.match(/href=["']\/assets\/([\w.-]+\.css)["']/i);
  const jsMatch = indexHtml.match(/src=["']\/assets\/([\w.-]+\.js)["']/i);

  const files = fs.readdirSync(assetsDir);
  const cssFile = cssMatch ? cssMatch[1] : (files.find(f => f.startsWith('index-') && f.endsWith('.css')) || files.find(f => f.endsWith('.css')));
  const jsFile = jsMatch ? jsMatch[1] : (files.find(f => f.startsWith('index-') && f.endsWith('.js')) || files.find(f => f.endsWith('.js')));

  console.log(`Bundling single file: Resolved main CSS as "${cssFile}", main JS as "${jsFile}"`);

  if (cssFile && fs.existsSync(path.join(assetsDir, cssFile))) {
    const cssContent = fs.readFileSync(path.join(assetsDir, cssFile), 'utf8');
    // Match the style link with dynamic filename
    const linkRegex = new RegExp(`<link\\s+[^>]*href=["']\\/assets\\/${cssFile.replace(/\./g, '\\.')}["'][^>]*>`);
    indexHtml = indexHtml.replace(linkRegex, () => `<style>${cssContent}</style>`);
  } else {
    console.warn('Warning: No css file found');
  }

  if (jsFile && fs.existsSync(path.join(assetsDir, jsFile))) {
    const jsContent = fs.readFileSync(path.join(assetsDir, jsFile), 'utf8');
    // Match the script element with dynamic filename
    const scriptRegex = new RegExp(`<script\\s+[^>]*src=["']\\/assets\\/${jsFile.replace(/\./g, '\\.')}["'][^>]*><\\/script>`);
    indexHtml = indexHtml.replace(scriptRegex, () => `<script type="module">\n${jsContent}\n</script>`);
  } else {
    console.warn('Warning: No js file found');
  }

  // Also replace any reference to absolute path '/assets/' if they slip through
  indexHtml = indexHtml.replace(/href="\/assets\//gi, 'href="./assets/');
  indexHtml = indexHtml.replace(/src="\/assets\//gi, 'src="./assets/');

  fs.writeFileSync(path.join(process.cwd(), 'index_single_file_live.html'), indexHtml, 'utf8');
  console.log('Single self-contained HTML file successfully generated at index_single_file_live.html!');
} catch (err) {
  console.error('Error bundling single file:', err);
}
