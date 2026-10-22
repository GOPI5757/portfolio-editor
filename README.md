# Portfolio Studio — Visual Editor

By Gopinath

An offline-first editor for static portfolio websites. Import a website ZIP, edit its content, and export the complete updated website. No backend, account, API key or publishing credentials are required.

## Start

1. Extract the editor ZIP.
2. Open **index.html** in desktop Chrome or Edge. The packaged hosting version is named **index.html**.
3. Choose your portfolio ZIP, not the editor ZIP.
4. In **Select to edit**, click text to type on the page. Click outside or press Enter to save; Escape cancels the current text edit.
5. Use the floating bar for fonts, size, color and alignment. Scroll it sideways when the available width is small. **More** opens the inspector.
6. Use **Browse website** to follow local project links, categories and pages. Return to **Select to edit** on the destination page.
7. Click **Export website**, extract the result, and publish those website files through your usual hosting workflow.

Your source ZIP is never overwritten. Editing here does not publish anything.

## Simple controls

The inspector shows the selected content's options, with additional groups collapsed until needed. File names, configuration locations and source browsing are removed from the normal editing interface. Existing settings are updated where a reliable connection is found; otherwise scoped element edits are used. Detected helper defaults are overridden locally instead of changing every element using that helper.

Click the sidebar arrow to reduce it to icons. Hover an icon to see its name. The editor starts dark unless you previously chose light; the theme switch remembers your choice. Editor theme and credit do not change your website.

Text parts remain separate: clicking the bold name in a sentence lets you edit that text without flattening surrounding spans. The inspector also provides individual text-part fields. The formatting bar stays within the visible preview area.

## Add and arrange content

**+ Add** appears beside recognized lists in the preview, and on the floating bar when a selected element belongs to a recognizable list. **Content** also lists detected projects, categories, media and other repeatable groups. Select an item to edit its fields; use the arrows to reorder and Remove to delete it.

New data-backed items copy an existing item's layout and details. The editor creates a unique ID when the item has one. Replace the copied text, images and details before publishing. For a separate static HTML detail page, **Copy detail page** creates a new page alongside the original and updates the new card's link. For outside destinations, enter the new address. Existing target/new-tab attributes are retained. Unknown destinations require an explicit link choice.

A shared query/hash-based detail renderer continues to use its existing data structure. Adding content does not synthesize new application logic. If a site uses separate registries or custom actions, those relationships may require their own content settings; arbitrary JavaScript event-handler behavior cannot be inferred universally.

Removing the last item retains a template in the exported website's studio metadata so the layout can be reused later. Such empty groups remain available through Content even when there is no visible card to select.

Code walkthrough controls remain available from **Code walkthroughs** in the sidebar. In the gameplay portfolio's project settings, **Edit code walkthroughs** opens the project's existing code registry or creates its empty entry.

## Media

The **Asset library** mirrors the ZIP's folders. Choose or create a folder before uploading images, videos or documents. Use **Choose image** beside a setting to connect the file. Rename/move updates recognizable literal references. Dynamically constructed file paths cannot always be relinked automatically.

Media is not compressed or re-edited by this editor. Keep your original media backups.

## Save and undo

**Save draft** stores one current draft on this device in browser storage. Clearing browser data can remove it, so export regularly. **Ctrl+Z** undoes a website edit; **Ctrl+Y** redoes it. While directly typing, native text undo takes precedence; finish the text edit to undo a website change. **Ctrl+S** saves a local draft.

Exports include original files and changes. Unchanged file contents are preserved. The editor toolbar, selection outlines and temporary text wrappers are not exported. Scoped edits and remembered item layouts, when used, are saved under studio/ and must stay with the exported website.

## Supported analysis and limits

This is a local structural analyzer, not a hosted AI model. It recognizes static JavaScript/JSON data, helper arguments and defaults, imported references, repeated HTML and local links. It does not execute configuration to guess values. Duplicate/ambiguous matches are not silently assigned to an arbitrary source.

It cannot fully understand every possible website, computed route, event handler, external data source, server application or unbuilt framework project. Import static built output. Some unusual layouts or calculated settings need website-specific support. Renaming IDs or changing the overall markup can invalidate an existing fallback element selection; select it again after a redesign.

The isolated preview blocks external navigation, remote scripts, API calls and form submission. Local HTML navigation and recognized query/hash routes stay within the imported site. The exported site retains its original code and behavior. External images, fonts and embedded videos still need a connection.

## Package

- Standalone editor HTML; all editor dependencies are bundled.
- source/: readable editor sources and dependency licenses.
- build.py: rebuild using Python's standard library.
- VALIDATION.md: tests and current verification limits.

The package contains no portfolio archives, private media, saved drafts or test exports.
