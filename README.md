# Portfolio Studio

A local browser editor for Gopinath's static portfolio. It imports your website ZIP, reads its configuration, previews it, and exports the complete edited website. No account, backend, subscription or publishing credentials are needed.

## Start here

1. Extract this editor ZIP to a folder on your computer.
2. Open **index.html** in a current desktop Chrome or Edge browser. Double-clicking it is enough. Nothing needs installing.
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

For ordinary static websites, choose an HTML page in the preview page picker. Select a text leaf or image to edit its original HTML text/attributes. The Appearance panel provides color pickers with opacity, numeric size/spacing controls with unit choices, and alignment/weight/layout dropdowns. Matching configuration styles are updated in their original files. Other appearance changes are saved as page/project-scoped element edits, with a Reset option. **Source files** provides direct editing for HTML, CSS, JavaScript, JSON, SVG and text files; JavaScript and JSON syntax are checked on save.

Static exported JS objects/arrays and JSON inside `config/` are exposed as controls. Imported references and computed expressions are retained as code, with a link to their source when available. Literal values inside helper calls (for example `text('Game Artist', {...})`) can also be edited without evaluating or replacing the helper call. The editor does not execute arbitrary configuration expressions to turn them into controls. It cannot automatically understand every custom schema or every framework. The preview supports local module imports, literal dynamic imports and top-level await. Computed import paths and cyclic module initialization are not supported. Server-side sites, unbuilt React/Vue projects and package imports need their usual build tools; import their static output instead.

The isolated preview disables external navigation, remote scripts, API requests and form submissions. Internet-hosted images, fonts and YouTube still need network access. Your exported website retains its original behaviour. Configuration controls and export work offline; normal browser security restrictions still apply.

## Included files

- `index.html`: standalone editor with its dependencies bundled.
- `source/`: readable HTML, CSS and JavaScript sources, with local vendor libraries.
- `README.md`: this guide.
- `VALIDATION.md`: checks performed against the supplied portfolio.
- `build.py`: rebuilds the standalone HTML from `source/` using Python's standard library; only needed if you edit the editor's source.

Third-party library licenses are included in `source/vendor/`. The standalone file also contains their license notices. Your portfolio media and private files are not bundled with the editor.

## Navigation and element-edit fixes (22 October 2026)

Internal section links, category links, subcategories and local HTML pages are handled within the imported site preview. They cannot resolve a fragment against the editor's own page. The page picker uses this artist template's About, Projects and Contact sections.

Select to edit connects visible text to matching configuration literals, including helper-call arguments. If multiple exact matches exist, inspect the shown source file before editing. Plain HTML is edited directly; matching JavaScript text literals can also be edited directly. For generated content with no identifiable source value, the editor saves page/project-scoped changes in `studio/element-edits.json` and `js/studio-element-edits.js`, and links the runtime from the affected HTML page. These files are included on export. Keep them with your site. Such fallback edits depend on the selected element's structure; reselect it if you later redesign that page.

Edits are saved in sequence so rapid text and appearance changes do not overwrite each other. The exported site contains your changes; importing it again keeps them available.

## Editor theme and credit

Use the Dark mode switch in the welcome header or editor toolbar to switch between light and dark. The preference is saved in this browser when local storage is available. By Gopinath appears beneath Portfolio Studio on both screens. The theme and credit belong to the editor only; they are not inserted into your imported or exported website.

## Preview, formatted text and inspector navigation

The center preview fits the remaining workspace height. Scroll inside the website to reach its content; the editor header and inspector stay in place. Device presets change the website's logical width, while Fit canvas uses the available width. Use **Top** to return the website to its start.

Select a sentence containing spans, bold text or links to edit its individual **Text parts**. Keep spaces between parts where needed. Select the inline span itself to edit just that text. Formatting and nested markup are retained. Static HTML updates its original text nodes; generated content uses the page-scoped fallback files described above.

Use the larger **Back**, **Forward** and **Parent** arrow buttons above the inspector to navigate previously selected elements and configuration sections.

- **Ctrl+Z** (Mac: Cmd+Z): undo a website edit.
- **Ctrl+Y** or **Ctrl+Shift+Z** (Mac: Cmd equivalents): redo.
- **Ctrl+S** (Mac: Cmd+S): save a local draft.

Workspace undo/redo also works while the preview has focus. Native text undo remains available in source-editing dialogs and the imported website's own text inputs. Pending inspector edits are committed before workspace undo, redo and export.

## Website structure editor update

Choose **Website structure** in the left sidebar to see the detected settings groups, repeatable lists, connections between files, and file coverage. The editor reads configuration folders first, then the other supported source files. Analysis happens on your device. It does not upload the website or run configuration code to inspect it.

### Editing a selected element

1. Click **Select to edit**, then click the element in the preview.
2. Edit its text or media field. **Content & custom settings** leads to the surrounding object, helper options, parent sections and repeatable lists.
3. Open only the group you need. Custom switches, numbers, text, media paths, nested objects and lists use the same controls as the original configuration fields.
4. Use **Find an inspector setting** to filter the current panel, or **Search website structure** to find groups and fields across files. **Appearance** and **Element attributes** stay collapsed until needed.

A source match is based on the selected content and its context. If multiple sources contain the same value, they are shown separately; check the file and surrounding settings before editing. The editor does not silently pick an ambiguous match.

### Helper functions and shared settings

Objects containing spreads and calls such as `text('Title', {...options})` now expose their local fields without replacing the helper or flattening its code. **Inherited settings** follows resolvable imports/local definitions. **Shared helper defaults** exposes a statically identifiable returned defaults object. Editing a shared value affects every place that uses it.

When a helper has a recognizable options argument spread into its result, **Use a local override** adds an existing default to that element's own options. Change the new field there to customize only that element. Unresolved expressions retain a source-editing link instead of being executed or guessed.

### Lists without config files

- **Data-driven lists:** JavaScript arrays can be detected outside `config/`, including in inline scripts. Selecting content from an item leads to **Manage list**, with add, duplicate, reorder and remove controls. For an empty literal array used by a recognizable `map`, `forEach` or `filter` callback, accessed item fields provide a suggested starting shape. Review it before use; inferred field types are suggestions.
- **Repeated HTML:** Similar sibling cards, articles, list entries and image groups are detected from the original HTML. **Repeated content** opens their list controls. **Add item from template** duplicates a starting item; **Edit item** changes its text parts, links and media. Internal IDs and links are adjusted in the copy. One template item is retained so the group can still be expanded later.
- A copied HTML item does not automatically acquire custom JavaScript event handlers or new application records. Existing delegated event handling may work, but application-specific behavior may require source edits. Dynamically generated lists should be changed through their data array when one is detected.

### Coverage and limits

Automatic structured controls cover static JavaScript objects/arrays, supported helper arguments and returned defaults, JSON, and recognizable HTML collections. The analysis also indexes local module dependencies and HTML/CSS resource links. The preview continues to support the static website patterns described earlier in this guide.

There is no universal way for this offline editor to infer the meaning of every possible program. Arbitrary computations, API/server-generated content, minified libraries, unsupported languages such as TypeScript/Vue/YAML, and unbuilt framework applications may need their source or normal build tools. These files are identified in **Analysis coverage & files**, retained on export, and supported textual formats can be opened in **Source files**. An analysis result does not imply that every listed file can run in the preview.

Source edits, list changes and generated-element edits use the existing undo/redo stack, draft storage and ZIP export. Your original ZIP remains unchanged.
