const vscode = (window as any).vscode;
const panelMode = (window as any).panelMode;
const objectInfo = (window as any).objectInfo;
const vsSettings = (window as any).vsSettings;

import { observable } from 'aurelia-framework';
import { ColumnApi, GridApi, GridOptions } from 'ag-grid-community';
import { firstBy } from 'thenby';

export class App {

  private gridOptions: GridOptions;
  private api: GridApi;
  private columnApi: ColumnApi;

  data: Array<any> = [];
  results: Array<any> = [];
  query: string = "";
  activeType: string = "";
  count: number = 0;
  loaded: boolean = false;
  contextMenu: HTMLElement;
  currentRowHeight: number;

  mode: string;
  customLinks: Array<any> = [];
  events: Array<any> = [];
  showEvents: boolean = false;
  showEventSubs: boolean = false;
  showTests: boolean = false;
  headerType: string = 'object';

  @observable
  TargetObjectHeader: string = 'Extends';

  vsSettings: any;

  @observable
  objectInfo: any;

  @observable
  currentProject: boolean;

  @observable
  showMenu: boolean = false;

  @observable
  selectedObject: any;

  @observable
  hoverObject: any;

  dragOptions: any;

  @observable
  allRowsSelected: boolean = false;

  showMarkedOnly: boolean = false;

  constructor() {
    this.gridOptions = <GridOptions>{
      defaultColDef: {
        resizable: true,
        sortable: true,
        editable: false
      }
    };
  }

  attached() {
    this.mode = panelMode;
    console.log('Panelmode:', this.mode);
    this.objectInfo = objectInfo;
    this.activeType = "";
    this.currentProject = false;
    this.vsSettings = vsSettings;

    this.gridOptions.rowHeight = this.getRowHeight();
    this.gridOptions.onGridReady = () => {
      this.api = this.gridOptions.api;
      this.columnApi = this.gridOptions.columnApi;

      this.columnApi.setColumnVisible("EventType" as any, this.showEvents === true);
      this.columnApi.setColumnVisible("EventName" as any, this.showEvents === true);
      this.columnApi.setColumnVisible("TargetObject" as any, !this.showEvents);
      this.columnApi.setColumnVisible("EventPublisher" as any, this.showEventSubs);
      //this.columnApi.setColumnVisible("Version" as any, !this.showEvents);
      //this.columnApi.setColumnVisible("Application" as any, !this.showEvents);
      this.columnApi.setColumnVisible("Scope" as any, !this.showEvents);
      this.columnApi.setColumnVisible("UnitTest" as any, this.showTests);
    }

    window.addEventListener('message', event => {
      this.loaded = false;
      const message = event.data; // The JSON data our extension sent
      switch (message.command) {
        case 'data':
          this.data = message.data;
          this.customLinks = message.customLinks;
          this.events = message.events;
          this.loaded = true;
          this.filterType("");
          break;
        case 'designer':
          this.objectInfo = message.objectInfo;
          break;
        case 'eventlist':
          this.events = message.events;
          this.setEventsView();
          this.filterType("");
          this.loaded = true;
          this.columnApi.setColumnVisible("Type" as any, false);
          this.columnApi.setColumnVisible("Id" as any, false);
          this.columnApi.setColumnVisible("Name" as any, false);
          this.columnApi.setColumnVisible("Version" as any, false);
          this.columnApi.setColumnVisible("Publisher" as any, false);
          //this.columnApi.setColumnVisible("Application" as any, false);
          break;
      }

      this.loaded = true;
    });

    window.addEventListener('field-onmove', (event: any) => {
      let message = Object.assign({}, this.objectInfo);
      message.SourceCodeAnchor = event.detail.anchor;
      message.SourceCodeAnchorInfo = event.detail;
      this.sendCommand(message, 'MoveSource');
    });

    window.addEventListener('field-onclick', (event: any) => {
      let message = Object.assign({}, this.objectInfo);
      message.SourceCodeAnchorInfo = event.detail;
      this.sendCommand(message, 'SelectSource');
    });

    if (this.loaded !== true) {
      this.refreshDesigner();
    }
  }

  search(newQuery?: string) {
    if (newQuery && newQuery != "") {
      this.query = newQuery;
    }

    let source = this.showEvents === true || this.showTests === true ? this.events : this.data;

    this.results = source
      .filter(f =>
        (this.activeType != "" ? f.Type == this.activeType : true)
        &&
        (this.currentProject == true ? f.FsPath != "" : true)
        &&
        (this.showMarkedOnly === true ? f.Marked == true : true)
        &&
        (this.showEvents ? f.EventPublisher == !this.showEventSubs : true)
        &&
        (this.showTests === true ? f.EventType == 'Test' : true)
        &&
        (f.Id.toString().indexOf(this.query.toLowerCase()) != -1
          || f.Publisher.toLowerCase().indexOf(this.query.toLowerCase()) != -1
          || f.Version.toLowerCase().indexOf(this.query.toLowerCase()) != -1
          || this.searchParts(this.query, `${f.Type}${f.Id}`) == true
          || this.searchParts(this.query, this.showEvents ? `${f.Name} ${f.FieldName != '' ? f.FieldName + ' ' : ''}${f.EventName}` : f.Name) == true)
      );

    this.results.sort(
      firstBy(function (v1, v2) { return v1.TypeId - v2.TypeId; })
        .thenBy("Id")
    );

    console.log(this.results);

    this.count = this.results.length;
  }

  filterType(type, reset?) {
    if (type == "") {
      this.activeType = "";
      if (reset === true || this.currentProject)
        this.query = "";
      this.search("");
    } else {
      this.activeType = type;
      this.search("");
    }

    if (this.query != "") {
      this.search();
    }

    this.count = this.results.length;
    this.selectedObject = null;
  }

  sendCommand(element, command, additionalCommands?: any) {
    element = Object.assign({}, element);
    let name = element.Name;
    let type = element.Type;
    let id = element.Id;

    if (command == 'Run' && element.TargetObject) {
      let parent = this.data.filter(f => f.Type == type.replace('Extension', '').replace('Customization', '') && f.Name == element.TargetObject);
      if (parent.length > 0) {
        name = element.Name;
        type = element.Type.replace('Extension', '');
        id = parent[0].Id;
      }
    }

    if (command == 'DefinitionExt' && element.TargetObject) {
      command = 'Definition';
      element.Name = element.TargetObject;
      name = element.Name;
    }

    if (command == 'DefinitionEventPub' && element.TargetObject) {
      command = 'Definition';
      element.Name = element.TargetObject;
      element.Type = element.TargetObjectType;
      name = element.Name;
      type = element.Type;
      element.FsPath = "";
    }

    this.showMenu = false;

    let message = {
      Type: type,
      Id: id,
      Name: name,
      FsPath: element.FsPath,
      Command: command,
      EventData: element,
      Objects: [],
      TargetObject: element.TargetObject
    };

    if (command == 'BrowserPreview') {
      message.Objects = this.data;
    }

    let messages = [message];

    if (additionalCommands) {
      messages = messages.concat(additionalCommands);
    }

    vscode.postMessage(messages);
  }

  searchParts(searchString: string, what: string) {
    let search: any = new RegExp(searchString, "gi"); // one-word searching

    // multiple search words
    if (searchString.indexOf(' ') != -1) {
      search = "";
      var words = searchString.split(" ");

      for (var i = 0; i < words.length; i++) {
        search += "(?=.*" + words[i] + ")";
      }

      search = new RegExp(search + ".+", "gi");

    }

    return search.test(what) == true;
  }

  selectionChanged(elem, event) {
    let target = event.target;
    if (target)
      this.showMenu = target.tagName.toLowerCase() == "a" && target.className.indexOf("context-menu-btn") != -1;
    else
      this.showMenu = false;
  }

  selectRow(elem, event) {
    if (!event.node || event.node.selected !== true) {
      return;
    }

    if (this.selectedObject == elem) {
      return;
    }

    this.selectedObject = elem;
  }

  setContextBtnVisible(elem) {
    if (elem == null || elem == this.selectedObject) {
      this.hoverObject = {};
      return;
    }

    this.hoverObject = elem;
  }

  setContextMenuVisible(event, currRec) {
    this.selectRow(currRec, event);
    this.showMenu = !this.showMenu;
    let rect = (event.target as HTMLElement).getBoundingClientRect();
    this.contextMenu.style.left = rect.left + 'px';
    this.contextMenu.style.top = rect.top + 'px';
  }

  setEventsView(skipSearch?: boolean) {
    this.showTests = false;
    this.showEvents = !this.showEvents;
    this.headerType = this.showEvents ? 'event' : 'object';

    this.columnApi.setColumnVisible("EventType" as any, this.showEvents);
    this.columnApi.setColumnVisible("EventName" as any, this.showEvents);
    this.columnApi.setColumnVisible("TargetObject" as any, !this.showEvents);
    this.columnApi.setColumnVisible("EventPublisher" as any, false);
    this.columnApi.setColumnVisible("UnitTest" as any, this.showTests);
    //this.columnApi.setColumnVisible("Version" as any, !this.showEvents);
    //this.columnApi.setColumnVisible("Application" as any, !this.showEvents);

    if (skipSearch !== true)
      this.search();
  }

  setEventSubscriberView() {
    this.showEventSubs = !this.showEventSubs;
    this.headerType = this.showEventSubs ? 'subscription' : this.showEvents ? 'event' : 'object';
    this.columnApi.setColumnVisible("TargetObject" as any, !this.showEventSubs && !this.showEvents);
    this.columnApi.setColumnVisible("EventPublisher" as any, this.showEventSubs);
    this.TargetObjectHeader = this.showEventSubs ? 'Publisher' : 'Extends';
    this.search();
  }

  setTestMethodView() {
    this.showEvents = false;
    this.showEventSubs = false;
    this.showTests = !this.showTests;
    this.headerType = this.showTests ? 'test' : this.showEventSubs ? 'subscription' : this.showEvents ? 'event' : 'object';
    this.columnApi.setColumnVisible("EventType" as any, !this.showTests && this.showEvents);
    this.columnApi.setColumnVisible("EventName" as any, !this.showTests && this.showEvents);
    this.columnApi.setColumnVisible("EventPublisher" as any, false);
    this.columnApi.setColumnVisible("UnitTest" as any, this.showTests);
    this.columnApi.setColumnVisible("TargetObject" as any, !this.showTests);
    this.search();
  }

  setCurrentProjectFilter() {
    this.currentProject = !this.currentProject;
    this.search('');
  }

  showAll() {
    this.currentProject = false;
    this.filterType('');
  }

  addNewObject(type) {
    this.sendCommand({ Type: type }, 'NewEmpty');
  }

  addNewCustomObject(link) {
    this.sendCommand({ FsPath: link.path }, 'NewCustomSnippet');
  }

  refreshDesigner() {
    this.loaded = false;
    this.sendCommand({}, 'Refresh');
  }

  openPageDesigner(element) {
    this.sendCommand(element, 'Design');
  }

  compilerCommand(type) {
    this.sendCommand({ Type: type }, 'Compiler');
  }

  showEventParams(element) {
    this.sendCommand(element, 'CopyEvent');
  }

  designerFieldOnClick(event) {
    console.log(event);
  }

  markAllObjects(event, record) {
    this.allRowsSelected = !this.allRowsSelected;
    for (let row of this.results) {
      row.Marked = this.allRowsSelected;
    }
  }

  markSelectedObject(event, record) {

  }

  setShowMarkedOnly() {
    this.showMarkedOnly = !this.showMarkedOnly;

    this.search();
  }

  exportObjectList() {
    let data = this.api.getDataAsCsv({ columnSeparator: ';', suppressQuotes: true });
    let message = { 'Data': data };
    this.sendCommand(message, 'ExportCsv');
  }

  getRowHeight() {
    let height = 40;
    switch (this.vsSettings.gridRowHeightOption) {
      case "large":
        height = 40;
        break;
      case "medium":
        height = 30;
        break;
      case "small":
        height = 20;
        break;
      case "custom":
        let check = parseInt(this.vsSettings.gridRowHeightPixels);
        height = check === NaN ? height : check;
        break;
      default:
        break;
    }

    this.currentRowHeight = height;
    return height;
  }

  runTest(element) {
    this.sendCommand(element, 'ALTestRunner');
  }

  runTests() {
    let selectedRows = this.events.filter(f => f.EventType == 'Test');
  }

  copySelectedEvents() {
    let selectedRows = this.results.filter(f => f.Marked === true);

    let message = {
      Command: 'CopyEvents',
      EventData: selectedRows
    };

    let messages = [message];
    vscode.postMessage(messages);
  }

  openEventList(selectedObject) {
    this.sendCommand(selectedObject, 'OpenEventList');
  }
}
