import * as vscode from 'vscode';
import * as path from 'path';
import * as utils from './utils';
import { ALCommandHandler } from './ALCommandHandler';
import { ALObjectCollector } from './ALObjectCollector';
import { ALTemplateCollector } from './ALTemplateCollector';
import { ALObjectParser } from './ALObjectParser';
import { ALObjectDesigner, ALSymbolPackage } from './ALModules';
import { ALEventGenerator } from './ALEventGenerator';
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
    public objectList?: Array<ALObjectDesigner.CollectorItem>;
    public eventList?: Array<ALObjectDesigner.CollectorItem>;

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

    public dispose() {
        ALPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    public async update() {
        if (!this._panel.webview.html)
            this._panel.webview.html = await this._getHtmlForWebview();

        let parser = new ALObjectParser();
        let objectCollector = new ALObjectCollector();
        switch (this.panelMode) {
            case ALObjectDesigner.PanelMode.List:                
                this.objectList = await objectCollector.discover();
                this.eventList = objectCollector.events;
                let links: Array<ALObjectDesigner.TemplateItem> = [];
                try {
                    let linkCollector = new ALTemplateCollector(this._extensionPath);
                    await linkCollector.initialize();
                    links = await linkCollector.discover();
                } catch (e) {
                    console.log(`Cannot load templates: ${e}`);
                }

                await this._panel.webview.postMessage({ command: 'data', data: this.objectList, 'customLinks': links, 'events': this.eventList });
                break;
            case ALObjectDesigner.PanelMode.Design:
                this.objectInfo = await parser.updateCollectorItem(this.objectInfo);

                await this._panel.webview.postMessage({ command: 'designer', objectInfo: this.objectInfo });
                break;
            case ALObjectDesigner.PanelMode.EventList:
                this.objectList = await objectCollector.discover();
                this.objectInfo = await parser.updateCollectorItem(this.objectInfo);
                let events = objectCollector.extractEvents(this.objectInfo.Type, this.objectInfo.Symbol, this.objectInfo, true, true);
                //let events = generator.generateTableEvents(this.objectInfo.Symbol, this.objectInfo, true);

                await this._panel.webview.postMessage({ command: 'eventlist', 'data': this.objectInfo, 'events': events });
                break;
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