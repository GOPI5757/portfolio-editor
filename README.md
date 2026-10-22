# Portfolio Studio

A local browser editor for Gopinath's static portfolio. It imports your website ZIP, reads its configuration, previews it, and exports the complete edited website. No account, backend, subscription or publishing credentials are needed.

## Start here

1. Extract this editor ZIP to a folder on your computer.
2. Open **Portfolio Studio.html** in a current desktop Chrome or Edge browser. Double-clicking it is enough. Nothing needs installing.
3. Choose your **portfolio website ZIP**. For your current portfolio, select `gopinath-portfolio.zip`, not this editor's ZIP.
4. Choose a section on the left, or click **Select to edit** and select text or an image in the preview.
5. Change a field and click outside it. The preview refreshes automatically.
6. Click **Export website** to download the complete updated portfolio ZIP.
7. Extract that exported ZIP and upload the website files to your existing GitHub Pages repository when you are ready to publish.

Your original ZIP is never overwritten. Editing here does not modify the public website. People viewing your public portfolio cannot publish changes through this editor: publishing still requires your GitHub access.

## Content and appearance

- **Profile & welcome**: name, role, description, tags, quick links and welcome appearance.
- **Projects**: add, duplicate, reorder, remove or disable games; edit descriptions, status, cover, facts, videos, galleries, documents and technical blocks.
- **Categories**: add categories; open a project's **Category ids** list to assign it. Category IDs are chosen from a dropdown.
- **Project appearance**: page backgrounds, spacing, grids, collapse behaviour and other shared settings.
- **Theme & typography**, **Site & navigation**, **Video & behaviour**, **Contact**, **Resume**, **Opening intro**, **Skills** and **Certificates** expose their own settings.
- **All configuration files** exposes every detected static configuration root, including additional or legacy settings. A setting only affects the website if its existing code actually uses it. The editor does not silently remove unused settings.

Nested settings open separately, so you do not have to face every control at once. Breadcrumbs at the top of the inspector return to the parent section. **Enabled** hides an item without deleting it. **Undo / Redo** covers the last 60 edits in the current session.

The screen/device picker changes the preview's real layout width and scales it to fit the editor. Hide the inspector to make more preview room. **Browse website** lets you use internal links, menus, media controls and collapse buttons; **Select to edit** instead chooses elements for editing. **Intro** replays the opening screen.

## Adding code walkthroughs

Open **Projects**, choose a game, then **Edit code blocks**. Its separate code configuration opens, or is created and connected automatically if missing.

1. Add a block, give it a title and choose **Stacked** or **Walkthrough**.
2. Open **Snippets**, add items, and set each filename, language, source code and explanation.
3. Set **Start line** to the excerpt's original file line and **Max height** to e.g. `24rem` or `380px`.
4. Add highlight ranges through **Highlights**.
5. For the connected walkthrough layout, add **Connections**. Choose the source and destination snippet and enter their source line numbers.

Existing technical work and source excerpts are preserved. Blocks and snippets can be duplicated, reordered, disabled and removed.

## Images, videos and documents

The **Asset library** mirrors the actual folders inside your website ZIP. It does not send files to a service.

1. Open the desired folder, or create one. For example `assets/images/projects/new-game/`.
2. Click **Upload files**, or drop files into the library's upload area. They are stored in that chosen folder with their filenames.
3. In a content field, click **Choose from asset library**, open the file, then **Use this file**. The relative path is written into the configuration.
4. **Move / rename** updates matching local literal references in JS/JSON, HTML attributes and CSS URLs. Dynamically assembled paths cannot be inferred automatically; inspect them in Source files if your own scripts construct filenames.
5. **Replace file** keeps the existing path and requires the same file extension. Image replacement clears the old responsive variants associated with that image so they cannot keep displaying the previous image.

The editor does not automatically compress images or re-edit videos. Use appropriately sized media. Keep external video links in YouTube fields; use a local file picker for settings that support local media. Deleting a referenced file can break its image/link; export checks report missing configuration assets.

When the supplied portfolio's intro configuration or collage assets change, the editor also refreshes its embedded first-paint intro HTML during export, preserving the immediate welcome screen.

## Saving, exporting and publishing

**Save draft** stores the imported ZIP and changes in this browser on this device using IndexedDB. Autosave is on by default. **Continue draft** appears when a saved draft is available. One current draft is retained per editor origin. Browser storage can be unavailable, cleared or evicted; it is not a permanent backup. Export ZIPs regularly.

Export preserves original file contents, including hidden files, unless you changed or deleted them. The ZIP's compression or metadata may differ; its unchanged file contents do not. The editor's preview bridge, temporary media URLs and editing outlines are not exported.

The exported ZIP is a website backup. Hosting typically requires extracting it and uploading the website files, rather than uploading the ZIP itself. No publishing happens until you do that.

## Plain HTML, CSS and JavaScript

For ordinary static websites, choose an HTML page in the preview page picker. Select a text leaf or image to edit its original HTML text/attributes. Style adjustments without a corresponding config style are saved in `css/studio-overrides.css`. **Source files** provides direct editing for HTML, CSS, JavaScript, JSON, SVG and text files; JavaScript and JSON syntax are checked on save.

Static exported JS objects/arrays and JSON inside `config/` are exposed as controls. Imported references and computed expressions are retained as code, with a link to their source when available. The editor does not execute arbitrary configuration expressions to turn them into controls. It cannot automatically understand every custom schema or every framework. Server-side sites, unbuilt React/Vue projects, package imports and complex module re-exports need their usual build tools; import their static output instead.

The isolated preview disables external navigation, remote scripts, API requests and form submissions. Internet-hosted images, fonts and YouTube still need network access. Your exported website retains its original behaviour. Configuration controls and export work offline; normal browser security restrictions still apply.

## Included files

- `Portfolio Studio.html`: standalone editor with its dependencies bundled.
- `source/`: readable HTML, CSS and JavaScript sources, with local vendor libraries.
- `README.md`: this guide.
- `VALIDATION.md`: checks performed against the supplied portfolio.
- `build.py`: rebuilds the standalone HTML from `source/` using Python's standard library; only needed if you edit the editor's source.

Third-party library licenses are included in `source/vendor/`. The standalone file also contains their license notices. Your portfolio media and private files are not bundled with the editor.
