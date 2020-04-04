import * as vscode from 'vscode';
import * as path from 'path';
import * as utils from './utils';
import { ALCommandHandler } from './ALCommandHandler';
import { ALObjectCollector } from './ALObjectCollector';
import { ALTemplateCollector } from './ALTemplateCollector';
import { ALObjectParser } from './ALObjectParser';
import { ALObjectDesigner, ALSymbolPackage } from './ALModules';
const fs = require('fs-extra');

/**
 * Manages AL Object Designer webview panel
 */
export class ALPanel {
    /**
     * Track the currently panel. Only allow a single panel to exist at a time.
     */
    public static currentPanel: ALPanel | undefined;
    public panelMode: ALObjectDesigner.PanelMode = ALObjectDesigner.PanelMode.List; // List, Designer
    public objectInfo: any;
    public static objectList?: Array<ALObjectDesigner.CollectorItem>;
    public static eventList?: Array<ALObjectDesigner.CollectorItem>;
    public currEvents?: Array<ALObjectDesigner.CollectorItem>;

    public static readonly viewType = 'alObjectDesigner';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionPath: string;
    private _disposables: vscode.Disposable[] = [];
    private _vsSettings: any;

    public static async open(extensionPath: string, mode: ALObjectDesigner.PanelMode, objectInfo?: any) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        // If we already have a panel, show it.
        if (ALPanel.currentPanel
            && ALPanel.currentPanel.panelMode == ALObjectDesigner.PanelMode.List
            && mode == ALObjectDesigner.PanelMode.List) {
            ALPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
            return;
        }

        // Otherwise, create a new panel.
        //let title = mode == "List" ? "AL Object Designer" : `AL Designer: ${objectInfo.Type} ${objectInfo.Id} ${objectInfo.Name}`;

        let title = '';
        switch (mode) {
            case ALObjectDesigner.PanelMode.List:
                title = 'AL Object Designer';
                break;
            case ALObjectDesigner.PanelMode.Design:
                title = `AL Designer: ${objectInfo.Type} ${objectInfo.Id} ${objectInfo.Name}`;
                break;
            case ALObjectDesigner.PanelMode.EventList:
                title = `AL Event List: ${objectInfo.Type} ${objectInfo.Id} ${objectInfo.Name}`;
                break;
        }

        const panel = vscode.window.createWebviewPanel(ALPanel.viewType, title, mode == ALObjectDesigner.PanelMode.List ? vscode.ViewColumn.One : vscode.ViewColumn.Two, {
            // Enable javascript in the webview
            enableScripts: true,

            enableFindWidget: true,

            retainContextWhenHidden: true,

            // And restric the webview to only loading content from our extension's `media` directory.
            localResourceRoots: [
                vscode.Uri.file(path.join(extensionPath, 'designer')),
                vscode.Uri.file(path.join(extensionPath, 'designer', 'fonts')),
                vscode.Uri.file(path.join(extensionPath, 'designer', 'scripts'))
            ]
        });

        ALPanel.currentPanel = new ALPanel(panel, extensionPath, mode, objectInfo);
        //await ALPanel.currentPanel.update();
    }

    public static async openDesigner(extensionPath: string) {
        let fpath = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri.fsPath : '';
        if (fpath == '') {
            return;
        }

        let objectInfo: any = {
            FsPath: fpath
        };

        let isLocalFile = (await fs.pathExists(fpath));

        if (!isLocalFile) {
            // extract symbol values from "imaginary" path
            fpath = path.normalize(fpath);
            let fileinfo = path.parse(fpath),
                fname = decodeURI(fileinfo.name),
                fdir = fileinfo.dir,
                dirparts = fdir.split(path.sep);

            objectInfo.Id = dirparts[dirparts.length - 1];
            objectInfo.Type = dirparts[dirparts.length - 2];
            objectInfo.Name = fname;
            objectInfo.FsPath = '';
        }

        let parser = new ALObjectParser(),
            symbol: any = null;
        if (isLocalFile) {
            symbol = await parser.parseFileBase(objectInfo.FsPath);
            objectInfo.Symbol = symbol;
            objectInfo.Id = symbol.Id;
            objectInfo.Name = symbol.Name;
            objectInfo.Type = utils.toUpperCaseFirst(symbol.Type);
        } else {
            symbol = await parser.parseSymbol(objectInfo);
        }

        // TODO: to be extended later
        if (["page"].indexOf(symbol.Type.toLowerCase()) == -1) {
            await vscode.window.showErrorMessage(`${objectInfo.Type} ${objectInfo.Id} ${objectInfo.Name} cannot be opened in Page Designer. :(`);
            return;
        }

        await ALPanel.open(extensionPath, ALObjectDesigner.PanelMode.Design, objectInfo);
    }

    public static async command(extensionPath: string, objectInfo: any) {
        await ALPanel.open(extensionPath, ALObjectDesigner.PanelMode.List, objectInfo);
        let handler: ALCommandHandler = new ALCommandHandler((ALPanel.currentPanel as ALPanel), extensionPath);
        await handler.dispatch(objectInfo);
    }

    public static showPanel() {
        ALPanel.currentPanel!._showPanel();
    }

    public static async preLoad() {
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Preload: discovering AL Objects and Symbols...',
            cancellable: true
        }, async (progress, token) => {
            token.onCancellationRequested(() => {
                console.warn("AL Object Designer: user cancelled the AL Object Discovery.");
            });

            let startTime = Date.now();
            let objectCollector = new ALObjectCollector();
            ALPanel.objectList = await objectCollector.discover();
            ALPanel.eventList = objectCollector.events;
            let endTime = Date.now();
            console.log(`AL Object Discovery took ${endTime - startTime}ms`);

            return true;
        });

    }

    public _showPanel() {
        this._panel.reveal(vscode.ViewColumn.One);
    }

    private constructor(
        panel: vscode.WebviewPanel,
        extensionPath: string,
        mode: ALObjectDesigner.PanelMode,
        objectInfo?: any
    ) {
        this._panel = panel;
        this._extensionPath = extensionPath;
        this.objectInfo = objectInfo;
        this.panelMode = mode;
        this._vsSettings = utils.getVsConfig();

        // Set the webview's initial html content 
        this._getHtmlForWebview().then(html => this._panel.webview.html = html);

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(async (messages) => {
            let handler: ALCommandHandler = new ALCommandHandler(this, extensionPath);

            for (let message of messages) {
                if (message.Command == 'Refresh') {
                    await this.update();
                    return;
                }

                await handler.dispatch(message);
            }
        }, null, this._disposables);

        if (mode === ALObjectDesigner.PanelMode.List) {
            let watcher = vscode.workspace.createFileSystemWatcher('**/*.al');
            watcher.onDidCreate(async (e: vscode.Uri) => {
                if (e.fsPath.indexOf('.vscode') == -1) {
                    await this.update();
                }
            });

            watcher.onDidChange(async (e: vscode.Uri) => {
                if (e.fsPath.indexOf('.vscode') == -1) {
                    await this.update();
                }
            });

            watcher.onDidDelete(async (e: vscode.Uri) => {
                if (e.fsPath.indexOf('.vscode') == -1) {
                    await this.update();
                }
            });

            this._disposables.push(watcher);
        }
    }

    public dispose() {
        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }

        ALPanel.currentPanel = undefined;
        ALPanel.objectList = undefined;
        ALPanel.eventList = undefined;
    }

    public async update() {
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Processing Workspace: discovering AL Objects and Symbols...',
            cancellable: true
        }, async (progress, token) => {
            token.onCancellationRequested(() => {
                console.warn("AL Object Designer: user cancelled the AL Object Discovery.");
            });

            let startTime = Date.now();
            await this._update();
            let endTime = Date.now();
            console.log(`AL Object Discovery took ${endTime - startTime}ms`);

            return true;
        });
    }

    private async _update() {
        try {
            if (!this._panel.webview.html)
                this._panel.webview.html = await this._getHtmlForWebview();

            let parser = new ALObjectParser();
            let objectCollector = new ALObjectCollector();
            switch (this.panelMode) {
                case ALObjectDesigner.PanelMode.List:
                    ALPanel.objectList = await objectCollector.discover();
                    ALPanel.eventList = objectCollector.events;
                    let links: Array<ALObjectDesigner.TemplateItem> = [];
                    try {
                        let linkCollector = new ALTemplateCollector(this._extensionPath);
                        await linkCollector.initialize();
                        links = await linkCollector.discover();
                    } catch (e) {
                        console.log(`Cannot load templates: ${e}`);
                    }

                    let objectsView = ALPanel.objectList.map(m => {
                        let result = JSON.parse(JSON.stringify(m));
                        delete result.EventParameters;
                        delete result.SymbolData;
                        return result;
                    });

                    let eventsView = ALPanel.eventList.map(m => {
                        let result = JSON.parse(JSON.stringify(m));
                        delete result.EventParameters;
                        delete result.SymbolData;
                        return result;
                    });

                    /*await utils.write(path.join('D:', 'objects_test_old.json'), JSON.stringify(ALPanel.objectList));
                    await utils.write(path.join('D:', 'events_test_old.json'), JSON.stringify(ALPanel.eventList));

                    await utils.write(path.join('D:', 'objects_test.json'), JSON.stringify(objectsView));
                    await utils.write(path.join('D:', 'events_test.json'), JSON.stringify(eventsView));*/

                    await this._panel.webview.postMessage({ command: 'data', data: objectsView, 'customLinks': links, 'events': eventsView });
                    break;
                case ALObjectDesigner.PanelMode.Design:
                    this.objectInfo = await parser.updateCollectorItem(this.objectInfo);

                    await this._panel.webview.postMessage({ command: 'designer', objectInfo: this.objectInfo });
                    break;
                case ALObjectDesigner.PanelMode.EventList:
                    if (ALPanel.objectList === undefined)
                        ALPanel.objectList = await objectCollector.discover();

                    this.objectInfo = await parser.updateCollectorItem(this.objectInfo);

                    let sourceTable = ALObjectParser.getSymbolProperty(this.objectInfo.Symbol, 'SourceTable');
                    if (sourceTable !== null) {
                        if (!isNaN(parseInt(sourceTable))) {
                            let table = ALPanel.objectList.find(f => f.Type && f.Type.toLowerCase() == 'table' && f.Id == (parseInt(sourceTable as string)));
                            if (table) {
                                for (let prop of this.objectInfo.Symbol.Properties) {
                                    if (prop.Name == 'SourceTable') {
                                        prop.Value = table.Name;
                                    }
                                }
                            }
                        }
                    }

                    let events = await objectCollector.extractEvents(this.objectInfo.Type, this.objectInfo.Symbol, this.objectInfo.EventData, true, true);
                    if (this.objectInfo.Symbol.FsPath) {
                        let levents = await objectCollector.extractLocalEvents(this.objectInfo.Type, this.objectInfo.Symbol, this.objectInfo.EventData);
                        events = events.concat(levents);
                    }
                    events = objectCollector.updateEventTargets(ALPanel.objectList, events);
                    ALPanel.currentPanel!.currEvents = events;
                    //let events = generator.generateTableEvents(this.objectInfo.Symbol, this.objectInfo, true);

                    let eventsObjView = events.map(m => {
                        let result = JSON.parse(JSON.stringify(m));
                        delete result.EventParameters;
                        delete result.SymbolData;
                        return result;
                    });

                    await this._panel.webview.postMessage({ command: 'eventlist', 'data': this.objectInfo, 'events': eventsObjView });
                    break;
            }
        } catch (e) {
            console.log(`An error occured in ALPanel.update() method. Details: ${e.message}`, e);
            await vscode.window.showErrorMessage(`An error occured in ALPanel.update() method. Details: ${e.message}`);
        }
    }

    private async _getHtmlForWebview() {
        // Get path to resource on disk
        // And get the special URI to use with the webview
        const htmlOnDiskPath = vscode.Uri.file(path.join(this._extensionPath, 'designer', 'index.html'));
        const appOnDiskPath = vscode.Uri.file(path.join(this._extensionPath, 'designer', 'scripts', 'vendor-bundle.js'));
        const appJsSrc: any = appOnDiskPath.with({ scheme: 'vscode-resource' });

        let content: string = (await utils.read(htmlOnDiskPath.fsPath) as string);
        content = content.replace('scripts/vendor-bundle.js', appJsSrc);
        content = content.replace('${panelMode}', this.panelMode);
        content = content.replace('${objectInfo}', JSON.stringify(this.objectInfo));
        content = content.replace('${vsSettings}', JSON.stringify(this._vsSettings));


        return content;
    }
}