# Change Log
All notable changes to the "al-object-designer" extension.

## 0.2.3 - 2020-09-25

**Bugfixes**:
 - Objectdiscovery related fixes

## 0.2.2 - 2020-04-27
**Enhancement:**
 - New option: "Paste All Event Parameters": Paste all event parameters when copying Event Publishers (default).

## 0.2.1 - 2020-04-17
**Enhancement:**
 - #58 Sidebar Icon in order to open Object Designer quickly
 - Find Usage of Event Publishers

## 0.2.0 - 2020-04-06
**Breaking changes:**
- .alcache, .altemplates folders moved under .vscode
- VSCode command prefixes change from 'extension.' to 'alObjectDesigner.'
- Toolbar "Snippets" menu is hidden by default


**Enhancement:**
- Compact UI, Dark Mode
- AL Interface support
- Visual Studio Code Remote / Online support
- Custom Symbol opening feature
- 'Go to Definition' in Symbols
- AL Test Runner integration
- New "Clear Cache" command
- New "Object Discovery" experience

**Bugfixes:**
- #48: Object Designer stucks in "Discovering Objects"
- #49: Filter resets after interacting with object
- #52: Open Objects in Multi-Root Workspace with Non-AL Folders
- #55: InternalEvent - "Discovering Objects" forever!


## 0.1.4 - 2020-01-03
**Enhancement:**
- New view type: Event List
    - Available from context menu: "Events" link
    - Shows events for a single object
    - "Standard" object/field/action events are listed for tables and pages
    - Copy multiple events
- Object List:
    - "Tests" switch: list unit tests within the workspace
    - Performance updates: number of full-reads have been reduced
    - Copy multiple events in Event mode
- Context menu:
    - Events: show events of a specific object
- **Upcoming in v0.1.5**:
    - AL Test Runner integration: `AL Test Runner` button
        - Run selected unit tests from Object Designer
        - Run all tests

**Bugfixes:**
- #46, #47: runtime symbols cannot be processed, skipping these files.
- #39: commented out EventSubscribers are parsed in some cases, partially fixed.


## 0.1.3 - 2019-11-22
**Enhancement:**
- Object List: 
    - New object type: Interface

## 0.1.2 - 2019-11-19
**Enhancement:**
- Object List: 
    - adjustable row height through settings
    - context menu adjusted to left so Object names remain visible

## 0.1.1 - 2019-11-18
- Bugfix: #45 Discovering stops at Event Subscriptions when Object ID is specified instead of [Type::Name] format.

## 0.1.0 - 2019-11-17
**Enhancements:**
- Object List:
    - New design and button layout
    - New data-grid component: ag-grid
    - AZ AL Dev Tools wizard integration: `AZ AL Wizard` button
    - CSV export of list contents
    - Optional: Show standard Table events, e.g. OnBeforeInsert or OnAfterDelete
    - Copy Object/Event name by double clicking on cell
    - Marked only switch: show marked objects only (similar to C/Side)
    - List Event Publishers in local files
    - List Event Subscribers in Symbol/local files
- Context menu:
  - `Preview`: Browser Preview integration
  - `+ Table Ext.`: create Table extension for selected Table
  - `+ Page Ext.`: create Page extension for selected Page
  - Run Query objects
- Commands:
  - New command: `Generate AL Tables` - create table objects using imported custom CSV format.

**Bugfixes:**
- Fixed sorting by Object Type and ID after search
- Multi-object/file parsing: case-insensitive parsing

## 0.0.7 - 2019-10-30
- Enhancement?: support for listing multiple objects per file.

## 0.0.6 - 2019-10-21
- Bugfix: objects without ID were not shown on Object Designer list, e.g. Profiles

## 0.0.5 - 2019-01-03
- New VS Command: 'AL Page Designer' - opens up Page Designer for currently edited AL Object (Page)
- Page Designer: 
    - Clicking on a field, group or part navigates to related source code section. Source file is automatically opened if needed.
    - Drag&drop support for fields, groups, parts, and actions
    - Updated style to make it more similar to Business Central
- Internal changes
    - Images folder: big gif videos have been moved outside of extension source in order to decrease extension size.
    - Internal commands have been refactored into separate classes.

## 0.0.4 - 2018-12-28
- `Object Parser` internal feature: generate symbol structure from source files.
- Page Designer and page generation now use Symbol definitions / `Object Parser`
- Page Designer view now works with Card/Document Symbols (experimental)
- Enhanced Page Design view: handling page-hierarchy and actions
- **Solved know issue:** ~~Page generation works only with local table objects. You cannot generate new page from standard objects (symbols).~~
- Fixed new list generation: Issue #6
- Caching: *.app files were processed on every window opening. This processed result is now cached and updated only when an .app file is changed.

## 0.0.3 - 2018-12-21
Event Browser feature:
- Browse/search events the same way as objects
- Copy selected event to clipboard by clicking on "Event Name"

## 0.0.2 - 2018-12-19
- Fixed packaged description.

## 0.0.1 - 2018-12-19
- Initial release
