# Change Log
All notable changes to the "al-object-designer" extension.

## 0.0.5-update-1 - 2019-10-21
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
