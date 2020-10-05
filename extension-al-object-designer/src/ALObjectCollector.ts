import { workspace, window } from 'vscode';
import * as path from 'path';
import * as utils from './utils';
import { ALSymbolPackage, ALObjectDesigner } from './ALModules';
import { ALObjectCollectorCache } from './ALObjectCollectorCache';
import { ALEventGenerator } from './ALEventGenerator';
import { ALProjectCollector } from './ALProjectCollector';
import { ALObjectParser } from './ALObjectParser';
import { platform } from 'os';
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
        "EnumExtensionTypes",
        "Interfaces",
        "DotNetPackages"
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
        "EnumExtension",
        "Interface",
        "DotNetPackage"
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
            let version = name.split('_').pop();

            return {
                name: name,
                appName: name.replace(version!, ''),
                version: version,
                fsPath: m
            };
        });

        dalFiles = tmpDalFiles
            .filter((val, i, arr) => {
                let result = arr.filter((f, j) => f.appName == val.appName);
                if (result.length > 0) {
                    let lastVersion = result.pop();
                    let checkVersionArr = arr.filter((f, j) => f.appName == val.appName);
                    let versions = [...new Set(checkVersionArr.map(item => item.version))];
                    if (versions && versions.length > 1 && this._vsSettings.multiplePackageVersionWarning === true) {
                        window.showWarningMessage(`Multiple package versions found: ${val.appName.replace(/_/g, ' ').slice(0, -1)}. Using ${lastVersion!.version}.`);
                    }

                    return arr.indexOf(lastVersion!) === i;
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
                return f.Type.toLowerCase() == pFile.Type.toLowerCase() && f.Name == pFile.Name;
            });

            if (checkIndex) {
                objs.splice(checkIndex, 1);
            }

            objs.push(pFile);
        }

        // update event targets
        this.events = this.updateEventTargets(objs, this.events);

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
                    parts[1] = '';
                }

                if (parts.length > 2) {
                    let objType = parts[0],
                        objId = parts[1];

                    let ucType = utils.toUpperCaseFirst(objType);
                    let extendIndex = parts.indexOf('extends') != -1 ? parts.indexOf('extends') : parts.indexOf('implements');
                    let nameEndIndex = extendIndex != -1 ? extendIndex : parts.length;
                    let name: string = parts.slice(2, nameEndIndex).join(" ").trim();
                    name = utils.replaceAll(name, '"', '');
                    ucType = ucType.replace('extension', 'Extension');

                    let targetObj = extendIndex != -1 ? parts.slice(extendIndex + 1, parts.length).join(" ").trim() : "";
                    targetObj = utils.replaceAll(targetObj, '"', '');

                    let projectInfo = projectCollector.getProjectFromObjectPath(file);
                    let info = {
                        Publisher: projectInfo.publisher,
                        Version: projectInfo.version,
                        Application: projectInfo.name
                    };

                    let newItem = {
                        "TypeId": this.alTypes.indexOf(ucType) || "",
                        "Type": ucType || "",
                        "Id": objId || "",
                        "Name": name || "",
                        "TargetObject": targetObj || "",
                        'TargetObjectType': ["Enum", "Codeunit"].indexOf(ucType) != -1 ? "Interface" : ucType.replace('Extension', ''),
                        "Publisher": projectInfo.publisher,
                        "Application": projectInfo.name || "",
                        "Version": projectInfo.version || "",
                        "CanExecute": ["Table", "Page", "PageExtension", "PageCustomization", "TableExtension", "Report", "Query"].indexOf(ucType) != -1,
                        "CanDesign": ["Page", "PageExtension"].indexOf(ucType) != -1,
                        "CanCreatePage": ['Table', 'TableExtension'].indexOf(ucType) != -1,
                        "FsPath": file,
                        "EventName": 'not_an_event',
                        // EventType?: string;
                        // EventPublisher?: boolean;
                        // TargetEventName?: string;
                        // TargetElementName?: string;
                        // EventParameters?: Array<ALSymbolPackage.Parameter>;
                        // "Events": levents,
                        // TestMethod: boolean
                        // FieldName: string;
                        "SymbolData": null,
                        // Symbol: any;
                        // Subtype: string;
                        "Scope": 'Extension'
                    };

                    objs.push(newItem);

                    // Process local eventpublishers
                    if (objType.toLowerCase() == 'codeunit') {
                        let levents = await this.extractLocalEvents(ucType, newItem, info);
                        this.events = this.events.concat(levents);
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
                    Application: json.Name,
                    Version: json.Version
                };

                for (let j = 0; j < this.types.length; j++) {
                    let elem: string = this.types[j];
                    let lType: string = this.alTypes[j];

                    if (json[elem]) {
                        let tempArr = json[elem].map(async (t: any, index: number) => {
                            let evts = await this.extractEvents(lType, t, info, this._vsSettings.showStandardEvents, this._vsSettings.showStandardFieldEvents);
                            levents = levents.concat(evts);

                            let scope = 'Extension';
                            if (t.Properties) {
                                let scopeProp = t.Properties.find((f: any) => f.Name === 'Scope');
                                if (scopeProp) {
                                    scope = scopeProp.Value;
                                }
                            }

                            let targetObject = t.TargetObject || "";
                            if (["Enum", "Codeunit"].indexOf(lType) != -1 && t.ImplementedInterfaces) {
                                targetObject = (t.ImplementedInterfaces as Array<string>).join(', ');
                            }

                            return {
                                "TypeId": j || "",
                                "Type": lType || "",
                                "Id": t.Id || "",
                                "Name": t.Name || "",
                                "TargetObject": targetObject,
                                'TargetObjectType': ["Enum", "Codeunit"].indexOf(lType) != -1 ? "Interface" : lType.replace('Extension', ''),
                                "Publisher": json.Publisher || "Platform",
                                "Application": json.Name || "",
                                "Version": json.Version || "",
                                "CanExecute": ["Table", "Page", "PageExtension", "TableExtension", "PageCustomization", "Report", "Query"].indexOf(lType) != -1,
                                "CanDesign": ["Page"].indexOf(lType) != -1,
                                "CanCreatePage": ['Table', 'TableExtension'].indexOf(lType) != -1,
                                "FsPath": "",
                                "EventName": 'not_an_event',
                                // EventType?: string;
                                // EventPublisher?: boolean;
                                // TargetEventName?: string;
                                // TargetElementName?: string;
                                // EventParameters?: Array<ALSymbolPackage.Parameter>;
                                // "Events": levents,
                                // TestMethod: boolean
                                "FieldName": "",
                                "SymbolData": {
                                    'Path': filePath,
                                    'Type': elem,
                                    'Index': index,
                                    'SymbolZipPath': ''
                                },
                                // Symbol: any;
                                // Subtype: string;
                                "Scope": scope
                            };
                        });

                        let tempArr2 = await Promise.all(tempArr);
                        objs = objs.concat(tempArr2);
                    }
                }
            }

            // re-process zip for internal paths
            if (this._vsSettings.useInternalNavigation === true || ["win32", "darwin"].indexOf(platform()) === -1) {
                let sourceFiles = Object.keys(zip.files).filter((i: any) => (i as string).endsWith('.al'));
                for (let sourceFile of sourceFiles) {
                    let contents: string = await zip.file(sourceFile).async('string');
                    let line = utils.getObjectHeadersFromText(contents);

                    if (line[0]) {

                        let parts = line[0].split(" ");

                        if (parts.length == 2) {
                            parts[2] = parts[1];
                            parts[1] = '';
                        }

                        if (parts.length > 2) {
                            let objType = parts[0];
                            let sliceIndex = ["interface", "profile", "controladdin", "dotnet"].indexOf(objType.toLowerCase()) != -1 ? 1 : 2;
                            let extendIndex = parts.indexOf('extends') != -1 ? parts.indexOf('extends') : parts.indexOf('implements');
                            let nameEndIndex = extendIndex != -1 ? extendIndex : parts.length;
                            let name: string = parts.slice(sliceIndex, nameEndIndex).join(" ").trim();
                            name = utils.replaceAll(name, '"', '');

                            let alObj: ALObjectDesigner.CollectorItem = objs.find(f => f.Type.toLowerCase() == objType.toLowerCase() && f.Name.toLowerCase() == name.toLowerCase());
                            if (alObj) {
                                alObj.SymbolData!.SymbolZipPath = sourceFile;
                            }
                        }
                    } else {
                        console.log('Error in re-process zip for internal paths: Object header was empty.', sourceFile, line);
                    }
                }
            }

            if (levents.length > 0) {
                this.events = this.events.concat(levents);
            }

            this.collectorCache.setCache(filePath, objs);
            this.collectorCache.setCache(filePath, levents, 'events');

        } catch (e) {
            this.log(`Error: ${e.message}. Possibly runtime package found, skipped: ${filePath}`, e);
        }

        return objs;
    }

    public async extractSymbolSource(info: ALObjectDesigner.SymbolData) {
        let zip: any = await utils.readZip(info.Path);
        let contents: string = await zip.file(info.SymbolZipPath).async('string');

        return contents;
    }

    public async extractLocalEvents(type: string, item: any, info: any) {
        let events: Array<any> = [];
        let parser = new ALObjectParser();
        let parsedEvents = await parser.ExtractMethodsWithAttrs(item.FsPath);
        for (let pKey in parsedEvents) {
            if (parsedEvents[pKey].length > 0) {
                let levents = parsedEvents[pKey].map((m: any) => {
                    return {
                        "TypeId": this.alTypes.indexOf(type) || "",
                        "Type": type || "",
                        "Id": item.Id || "",
                        "Name": item.Name || "",
                        "TargetObject": m.TargetObject || "",
                        'TargetObjectType': m.TargetObjectType,
                        "Publisher": info.Publisher,
                        "Application": info.Application || "",
                        "Version": info.Version || "",
                        "CanExecute": false,
                        "CanDesign": false,
                        // CanCreatePage: boolean;
                        "FsPath": item.FsPath,
                        'EventName': m.Name,
                        'EventType': m.EventType,
                        'EventPublisher': (m.EventType as string).endsWith('Event'),
                        'TargetEventName': m.TargetEventName || "",
                        'TargetElementName': m.TargetElementName || "",
                        'EventParameters': m.Parameters,
                        // Events: Array<any>
                        'TestMethod': m.EventType === 'Test',
                        "FieldName": "",
                        "SymbolData": null,
                        // Symbol: any
                        // SubType: string
                        "Scope": 'Extension'
                    }
                });
                events = events.concat(levents);
            }
        }

        return events;
    }

    public async extractEvents(type: string, item: any, info: any, showStandardEvents?: boolean, showFieldEvents?: boolean): Promise<any[]> {
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
                        let targetEventName = '';
                        let targetElementName = '';
                        if (attr.Arguments.length > 2) {
                            targetObj = attr.Arguments[1].Value;
                            targetObjType = attr.Arguments[0].Value;
                            if (attr.Arguments.length >= 4) {
                                targetEventName = attr.Arguments[2].Value
                                targetElementName = attr.Arguments[3].Value
                            }
                        }

                        levents.push({
                            'TypeId': this.alTypes.indexOf(type),
                            'Type': type,
                            'Id': item.Id,
                            'Name': item.Name,
                            "TargetObject": targetObj || "",
                            'TargetObjectType': targetObjType,
                            "Publisher": info.Publisher || "Platform",
                            "Application": info.Application || "",
                            "Version": info.Version || "",
                            "CanExecute": false,
                            "CanDesign": false,
                            // CanCreatePage: boolean
                            "FsPath": "",
                            'EventName': m.Name,
                            'EventType': attr.Name,
                            'EventPublisher': attr.Name.toLowerCase() != 'eventsubscriber',
                            'TargetEventName': targetEventName || "",
                            'TargetElementName': targetElementName || "",
                            'EventParameters': m.Parameters,
                            // Events: Array<any>
                            // TestMethod: boolean
                            "FieldName": "",
                            "SymbolData": null
                            // Symbol: any
                            // SubType: string
                            // Scope: string
                        });
                    }
                }
            }
        }

        if (showStandardEvents === true) {
            let generator = new ALEventGenerator();
            let events: Array<any> = [];
            info.TypeId = this.alTypes.indexOf(type);
            switch (type.toLowerCase()) {
                case 'table':
                    events = generator.generateTableEvents(item, info, showFieldEvents === true);
                    levents = levents.concat(events);
                    break;
                case 'page':
                    events = await generator.generatePageEvents(item, info, showFieldEvents === true);
                    levents = levents.concat(events);
                    break;
            }
        }

        return levents;
    }

    public updateEventTargets(objs: Array<any>, events: Array<any>) {
        let result = events.map(e => {
            if (e.EventType == "EventSubscriber") {
                let objData = objs.find(f => f.Type == e.TargetObjectType && f.Id == e.TargetObject);
                if (objData) {
                    e.TargetObject = objData.Name;
                }
            }

            return e;
        });

        return result;
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