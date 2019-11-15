# AL Object Designer

C/Side Object Designer was something that the new AL development environment lacks of very much. The idea behind this extension is to provide a main hub for daily development by giving back the ability of overview.

## Main Features

* **List Overview** of all AL objects in your project: based on symbols (*.app) and your local .al files.
* **List Events** from symbol objects, browse them in the same way as objects.
* **Live Update:** object list is automatically maintained as you create/change/delete objects or download symbols.
* **Multi-Folder workspaces** are supported: e.g. a workspace with MainApp/TestApp folders.
* **Object Search**: filter by Object Type, Name or ID.
* **Event Search**: filter by Object Type, Name, ID or Event Name.
* **Copy/Paste Events**: copy event subscription definition to clipboard by clicking on Event Name.
* **Object/Event Name filtering**: works with partial matches as well. Just like the Windows RTC Client's search field.
* **Run** selected objects.
* **Run** table/page **extentions**.
* **View definition of Symbols**: original file is opened for local files.
* **Generate new objects** from tables: card/list pages, report, query.
* **Built-in snippets**: generate new dictionary or entry tables using a single click.
* **Custom snippets**: use your own snippets placed in `<project root>/.altemplates` folder
* **Design view** for Pages (alpha): card/list layout is rendered for local pages. Card/Document Symbols are also supported.

### Optional integration with [AZ AL Dev Tools](https://marketplace.visualstudio.com/items?itemName=andrzejzwierzchowski.al-code-outline)
* **AZ AL Wizard** button: launch AL objects wizards

![](https://raw.githubusercontent.com/martonsagi/al-object-designer/master/media/preview1.PNG)

## Requirements

There are no hard dependencies as of v0.1.0.

Optional dependencies:
* [CRS AL Language Extension](https://marketplace.visualstudio.com/items?itemName=waldo.crs-al-language-extension)
  * If installed, `Run Object` function uses commands from this extension
* [AZ AL Dev Tools](https://marketplace.visualstudio.com/items?itemName=andrzejzwierzchowski.al-code-outline)
  * If installed, `AZ AL Wizard` button appears at the top left corner.

## VS Commands
* **AL Object Designer**: opens Object Overview
* **AL Page Designer**: opens up Page Designer for currently edited AL Object (Page)

![](https://raw.githubusercontent.com/martonsagi/al-object-designer/master/media/commands.png)

## Page Designer
This extension has a limited ability to view a rendered page layout without deployment, or move existing fields/actions on screen using drag&drop.
Supported page types:
* Card types: Card, Document
* List types: types other than Card/Document are regarded as List

Rendered layout is very similar to Business Central pages, although not an exact copy as I'm not using Office Fabric UI.

## Extension Settings

|Option   |Description   |
|---|---|
|renderPageParts   |Render PageParts in AL Page Designer   |
|showStandardEvents   |Show standard Table events, e.g. OnBeforeInsert or OnAfterDelete   |
|VsCodeBrowserPreview   |Turn on 'Preview' context menu on Object List. Works with UserPassword authentication.   |
|useCRS   |Run objects using CRS AL Extension (default)   |
|logging   |Diagnostic logging to Developer Tools console   |
|singleObjectPerFile   |Detection rule: one object per files   |
|useAZALDevTools   |Enable integration with AZ AL Dev Tools extension.   |

![](https://raw.githubusercontent.com/martonsagi/al-object-designer/master/media/preview8_settings.PNG)

## Known Issues

* Design feature works only with pages, the window is empty when selecting page extensions.
* View (Go to definition) is active for all object types, however, it will not work with Control Add-ins for example. 
* Event listing may include commented out event publishers/subscriptions.
* It might be too bright for dark themes. 

## Preview

### Searching for "Item Ledger Entry" table
![](https://raw.githubusercontent.com/martonsagi/al-object-designer/master/media/preview2.PNG)

### Find Page "Sales Order" as a dynosaur would :)
![](https://raw.githubusercontent.com/martonsagi/al-object-designer/master/media/preview3.PNG)

### Filter to workspace and check the context menu for more options
![](https://raw.githubusercontent.com/martonsagi/al-object-designer/master/media/preview4.PNG)

### Browse event publishers
![](https://raw.githubusercontent.com/martonsagi/al-object-designer/master/media/preview5.PNG)

### Browse event subscriptions
![](https://raw.githubusercontent.com/martonsagi/al-object-designer/master/media/preview6.PNG)

![](https://raw.githubusercontent.com/martonsagi/al-object-designer/master/media/preview10_EventPubSub.gif)

### AZ AL Dev Tools Wizard button
![](https://raw.githubusercontent.com/martonsagi/al-object-designer/master/media/preview7_AZIntegration.png)

### Browser Preview extension integration
![](https://raw.githubusercontent.com/martonsagi/al-object-designer/master/media/preview9_alobj_browser.jpg)

### C/Side-like markedonly feature to cherry-pick objects
![](https://raw.githubusercontent.com/martonsagi/al-object-designer/master/media/preview9_markedonly.png)

### Copy/Paste Events
![](https://raw.githubusercontent.com/martonsagi/al-object-designer/master/media/ALObjectDesigner_ObjectEventCopyPaste.gif)

### Real-time Page Designer (alpha)
![](https://raw.githubusercontent.com/martonsagi/al-object-designer/master/media/ALObjectDesigner_PageDesign.gif)

## Under the hood
AL Object Designer is a single-page [Aurelia](https://aurelia.io/) app that is embedded into a VS Code WebView and exchanges data back and forth.

----------------------------------------------

## For more information
[Github repo](https://github.com/martonsagi/al-object-designer): feel free to fork it or send feedback/pull requests.

**Happy AL coding!**
