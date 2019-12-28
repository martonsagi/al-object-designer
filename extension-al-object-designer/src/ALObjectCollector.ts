import { workspace } from 'vscode';
import * as path from 'path';
import * as utils from './utils';
import { ALSymbolPackage, ALObjectDesigner } from './ALModules';
import { ALObjectCollectorCache } from './ALObjectCollectorCache';
import { ALEventGenerator } from './ALEventGenerator';
import { ALProjectCollector } from './ALProjectCollector';
import { ALObjectParser } from './ALObjectParser';
const firstBy = require('thenby');

export class ALObjectCollector implements ALObjectDesigner.ObjectCollector {
    private _vsSettings: any;
    public events: Array<any> = [];
    private collectorCache: ALObjectCollectorCache;

    private types = [
        "Tables",
        "Pages",
        "Reports",
        "Codeunits",
        "Queries",
        "XmlPorts",
        "Profiles",
        "PageExtensions",
        "PageCustomizations",
        "TableExtensions",
        "ControlAddIns",
        "EnumTypes",
        "DotNetPackages",
        "Interfaces"
    ];

    private alTypes = [
        "Table",
        "Page",
        "Report",
        "Codeunit",
        "Query",
        "XmlPort",
        "Profile",
        "PageExtension",
        "PageCustomization",
        "TableExtension",
        "ControlAddIn",
        "Enum",
        "DotNetPackage",
        "Interface"
    ];

    public constructor() {
        this.collectorCache = new ALObjectCollectorCache();
        this._vsSettings = utils.getVsConfig();
    }

    public async discover() {
        return await this._getData();
    }

    //#region Process files

    private async _getData() {
        let objs: Array<any> = new Array();
        let fpaths: any = (workspace as any).workspaceFolders;
        let dalFiles: Array<any> = [];

        for (let wkspace of fpaths) {
            let fpath: any = path.join(wkspace.uri.fsPath, '.alpackages', path.sep),
                checkPath = await utils.folderExists(fpath);

            if (checkPath === true) {
                let items: any = await utils.readDir(fpath);
                items = items.filter((f: string) => f.endsWith('.app'));

                let files = items.map((f: any) => {
                    return path.join(fpath, f);
                });

                dalFiles = dalFiles.concat(files);
            }
        }

        let tmpDalFiles = dalFiles.map(m => {
            let name = path.basename(m);

            return {
                name: name,
                fsPath: m
            };
        });

        dalFiles = tmpDalFiles
            .filter((val, i, arr) => {
                let result = arr.filter((f, j) => f.name == val.name);
                if (result.length > 0) {
                    return arr.indexOf(result[0]) === i;
                }

                return false;
            })
            .map(m => m.fsPath);

        this.log('Symbol packages found.', dalFiles);

        let tasks: Array<Promise<any>> = [];
        for (let dal of dalFiles) {
            tasks.push(this._getWorkspaceData(dal));
        }

        tasks.push(this._CheckObjectInProject(objs));

        let res = await Promise.all(tasks);

        let projectFiles = [];
        if (dalFiles.length > 0) {
            projectFiles = res.pop();
        }

        for (let arr of res) {
            objs = objs.concat(arr);
        }

        for (let pFile of projectFiles) {
            let checkIndex = objs.findIndex((f: any) => {
                return f.Type.toLowerCase() == pFile.Type.toLowerCase() && f.Id == pFile.Id;
            });

            if (checkIndex) {
                objs.splice(checkIndex, 1);
            }

            objs.push(pFile);
        }

        // update event targets
        this.events = this.events.map(e => {
            if (e.EventType == "EventSubscriber") {
                let objData = objs.find(f => f.Type == e.TargetObjectType && f.Id == e.TargetObject);
                if (objData) {
                    e.TargetObject = objData.Name;
                }
            }

            return e;
        });

        objs = utils.uniqBy(objs, JSON.stringify);

        objs.sort(
            firstBy("TypeId")
                .thenBy("Id")
        );

        return objs as Array<ALObjectDesigner.CollectorItem>;
    }

    private async _CheckObjectInProject(objs: Array<any>) {
        let projectCollector = new ALProjectCollector();
        await projectCollector.init();

        let result = await workspace.findFiles('**/*.al');

        this.log('No local files detected.');

        if (result.length == 0) {
            return objs;
        }

        this.log('Local files found: ' + result.length);

        for (let item of result) {
            let file = item.fsPath;

            this.log('Current file: ' + file);

            let lines: Array<string> = [];
            if (this._vsSettings.singleObjectPerFile === true) {
                let line: string = await utils.getFirstCodeLine(file);
                lines.push(line);
            } else {
                lines = await utils.getObjectHeaders(file);
            }

            for (let line of lines) {
                let parts = line.split(" ");

                if (parts.length == 2) {
                    parts[2] = parts[1];
                    parts[1] = '0';
                }

                if (parts.length > 2) {
                    let objType = parts[0],
                        objId = parts[1];

                    let ucType = utils.toUpperCaseFirst(objType);
                    let extendIndex = parts.indexOf('extends');
                    let nameEndIndex = extendIndex != -1 ? extendIndex : parts.length;
                    let name: string = parts.slice(2, nameEndIndex).join(" ").trim();
                    name = utils.replaceAll(name, '"', '');
                    ucType = ucType.replace('extension', 'Extension');

                    let targetObj = extendIndex != -1 ? parts.slice(extendIndex + 1, parts.length).join(" ").trim() : "";
                    targetObj = utils.replaceAll(targetObj, '"', '');

                    let projectInfo = projectCollector.getProjectFromObjectPath(file);

                    let newItem = {
                        "TypeId": this.alTypes.indexOf(ucType) || "",
                        "Type": ucType || "",
                        "Id": objId || "",
                        "Name": name || "",
                        "TargetObject": targetObj || "",
                        "Publisher": projectInfo.publisher,
                        "Application": projectInfo.name || "",
                        "Version": projectInfo.version || "",
                        "CanExecute": ["Table", "Page", "PageExtension", "PageCustomization", "TableExtension", "Report", "Query"].indexOf(ucType) != -1,
                        "CanDesign": ["Page", "PageExtension"].indexOf(ucType) != -1,
                        "CanCreatePage": ['Table', 'TableExtension'].indexOf(ucType) != -1,
                        "FsPath": file,
                        "EventName": 'not_an_event',
                        "SymbolData": null,
                        "Scope": 'Extension'
                    };

                    objs.push(newItem);

                    // Process local eventpublishers
                    if (objType.toLowerCase() == 'codeunit') {
                        let parser = new ALObjectParser();
                        let parsedEvents = await parser.ExtractMethodsWithAttrs(file);
                        for (let pKey in parsedEvents) {
                            if (parsedEvents[pKey].length > 0) {
                                let levents = parsedEvents[pKey].map((m: any) => {
                                    return {
                                        "TypeId": this.alTypes.indexOf(ucType) || "",
                                        "Type": ucType || "",
                                        "Id": objId || "",
                                        "Name": name || "",
                                        'TargetObjectType': m.TargetObjectType,
                                        "TargetObject": m.TargetObject || "",
                                        "Publisher": projectInfo.publisher,
                                        "Application": projectInfo.name || "",
                                        "Version": projectInfo.version || "",
                                        "CanExecute": false,
                                        "CanDesign": false,
                                        "FsPath": file,
                                        'EventName': m.Name,
                                        'EventType': m.EventType,
                                        'EventPublisher': (m.EventType as string).endsWith('Event'),
                                        'TestMethod': m.EventType === 'Test',
                                        'EventParameters': m.Parameters,
                                        "FieldName": "",
                                        "SymbolData": null,
                                        "Scope": 'Extension'
                                    }
                                });
                                this.events = this.events.concat(levents);
                            }
                        }
                    }
                }
            }
        }

        return objs;
    }


    private async _getWorkspaceData(filePath: string) {
        let objs: Array<any> = new Array(),
            levents: Array<any> = [],
            isCached = await this.collectorCache.isCached(filePath);

        if (isCached) {
            let cacheInfo = await this.collectorCache.getCache(filePath);
            let eventInfo = await this.collectorCache.getCache(filePath, 'events');
            if (eventInfo.Items.length > 0) {
                this.events = this.events.concat(eventInfo.Items);
            }

            return cacheInfo.Items;
        }

        try {
            let zip: any = await utils.readZip(filePath);
            let files = Object.keys(zip.files).filter(i => i.indexOf('.json') != -1);
            if (files.length > 0) {
                let contents: string = await zip.file(files[0]).async('string');
                let json: ALSymbolPackage.SymbolReference = JSON.parse(contents.trim());
                let info = {
                    Publisher: json.Publisher,
                    Name: json.Name,
                    Version: json.Version
                };

                for (let j = 0; j < this.types.length; j++) {
                    let elem: string = this.types[j];
                    let lType: string = this.alTypes[j];

                    if (json[elem]) {
                        let tempArr = json[elem].map((t: any, index: number) => {
                            levents = levents.concat(this.extractEvents(lType, t, info, this._vsSettings.showStandardEvents, this._vsSettings.showStandardFieldEvents));

                            let scope = 'Extension';
                            if (t.Properties) {
                                let scopeProp = t.Properties.find((f: any) => f.Name === 'Scope');
                                if (scopeProp) {
                                    scope = scopeProp.Value;
                                }
                            }

                            return {
                                "TypeId": j || "",
                                "Type": lType || "",
                                "Id": t.Id || "",
                                "Name": t.Name || "",
                                "TargetObject": t.TargetObject || "",
                                "Publisher": json.Publisher || "Platform",
                                "Application": json.Name || "",
                                "Version": json.Version || "",
                                "CanExecute": ["Table", "Page", "PageExtension", "TableExtension", "PageCustomization", "Report", "Query"].indexOf(lType) != -1,
                                "CanDesign": ["Page"].indexOf(lType) != -1,
                                "CanCreatePage": ['Table', 'TableExtension'].indexOf(lType) != -1,
                                "FsPath": "",
                                //"Events": levents,
                                "EventName": 'not_an_event',
                                "FieldName": "",
                                "SymbolData": {
                                    'Path': filePath,
                                    'Type': elem,
                                    'Index': index
                                },
                                "Scope": scope
                            };
                        });


                        objs = objs.concat(tempArr);
                    }
                }
            }

            if (levents.length > 0) {
                this.events = this.events.concat(levents);
            }

            this.collectorCache.setCache(filePath, objs);
            this.collectorCache.setCache(filePath, levents, 'events');

        } catch (e) {
            this.log(`Runtime package found, skipped: ${filePath}`);
        }

        return objs;
    }

    public extractEvents(type: string, item: any, info: any, showStandardEvents?: boolean, showFieldEvents?: boolean) {
        let levents = [];

        if (item.Methods) {
            for (let m of item.Methods) {
                if (m.Attributes) {
                    let attr = m.Attributes.find((a: any) => {
                        return a.Name.indexOf('Event') != -1;
                    });

                    if (attr) {
                        let targetObj = '';
                        let targetObjType = '';
                        if (attr.Arguments.length > 2) {
                            targetObj = attr.Arguments[1].Value;
                            targetObjType = attr.Arguments[0].Value;
                        }

                        levents.push({
                            'TypeId': this.alTypes.indexOf(type),
                            'Type': type,
                            'Id': item.Id,
                            'Name': item.Name,
                            'TargetObjectType': targetObjType,
                            "TargetObject": targetObj || "",
                            "Publisher": info.Publisher || "Platform",
                            "Application": info.Name || "",
                            "Version": info.Version || "",
                            "CanExecute": false,
                            "CanDesign": false,
                            "FsPath": "",
                            'EventName': m.Name,
                            'EventType': attr.Name,
                            'EventPublisher': attr.Name.toLowerCase() != 'eventsubscriber',
                            'EventParameters': m.Parameters,
                            'TargetEventName': attr.Arguments[2],
                            "FieldName": "",
                            "SymbolData": null
                        });
                    }
                }
            }
        }

        if (showStandardEvents === true) {
            if (type == 'Table') {
                let generator = new ALEventGenerator();
                info.TypeId = this.alTypes.indexOf(type);
                let events = generator.generateTableEvents(item, info, showFieldEvents === true);
                levents = levents.concat(events);
            }
        }

        return levents;
    }

    public async getSymbolReference(data: ALObjectDesigner.SymbolData) {
        let zip: any = await utils.readZip(data.Path);
        let files = Object.keys(zip.files).filter(i => i.indexOf('.json') != -1);
        if (files.length > 0) {
            let contents: string = await zip.file(files[0]).async('string');
            let json: ALSymbolPackage.SymbolReference = JSON.parse(contents.trim());
            return json[data.Type][data.Index];
        }

        return null;
    }

    public log(message: string, vars?: any) {
        if (this._vsSettings.logging === true) {
            let msg = `al-object-designer INFO: ${message}`
            if (vars)
                console.log(msg, vars);
            else
                console.log(msg);
        }
    }

    //#endregion
}