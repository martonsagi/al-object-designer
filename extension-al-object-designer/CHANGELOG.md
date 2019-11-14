# Change Log
All notable changes to the "al-object-designer" extension.

## 0.1.0 - 2019-11-??
**Enhancements:**
- Object List:
    - New design and button layout
    - New data-grid component: ag-grid
    - AZ AL Dev Tools wizard integration: `AZ AL Wizard` button
    - CSV export of list contents
    - Optional: Show standard Table events, e.g. OnBeforeInsert or OnAfterDelete
    - Copy Object/Event name by double clicking on cell
    - Marked only switch: show marked objects only (similar to C/Side)
- Context menu:
  - `Preview`: Browser Preview integration
  - `+ Table Ext.`: create Table extension for selected Table
  - `+ Page Ext.`: create Page extension for selected Page
  - Run Query objects
- Commands:
  - New command: `Generate AL Tables` - create table objects using imported custom CSV format. TODO: docs

**Bugfix:**
- Fixed sorting by Object Type and ID after search

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
