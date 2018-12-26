import * as vscode from 'vscode';
import * as path from 'path';
import * as utils from './utils';
import { ALCommandHandler } from './ALCommandHandler';
import { ALObjectCollector } from './ALObjectCollector';
import { ALTemplateCollector } from './ALTemplateCollector';
import { ALObjectParser } from './ALObjectParser';
import { ALObjectDesigner } from './ALModules';

/**
 * Manages AL Object Designer webview panel
 */
export class ALPanel {
    /**
     * Track the currently panel. Only allow a single panel to exist at a time.
     */
    public static currentPanel: ALPanel | undefined;
    private panelMode: ALObjectDesigner.PanelMode = ALObjectDesigner.PanelMode.List; // List, Designer
    public objectInfo: any;
    public objectList: Array<ALObjectDesigner.CollectorItem> = [];
    public eventList: Array<ALObjectDesigner.CollectorItem> = [];

    public static readonly viewType = 'alObjectDesigner';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionPath: string;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionPath: string, mode: ALObjectDesigner.PanelMode, objectInfo?: any) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        // If we already have a panel, show it.
        if (ALPanel.currentPanel && (mode == "List")) {
            ALPanel.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        let title = mode == "List" ? "AL Object Designer" : `AL Designer: ${objectInfo.Type} ${objectInfo.Id} ${objectInfo.Name}`;
        const panel = vscode.window.createWebviewPanel(ALPanel.viewType, title, mode == "List" ? vscode.ViewColumn.One : vscode.ViewColumn.Two, {
            // Enable javascript in the webview
            enableScripts: true,

            retainContextWhenHidden: true,

            // And restric the webview to only loading content from our extension's `media` directory.
            localResourceRoots: [
                vscode.Uri.file(path.join(extensionPath, 'designer')),
                vscode.Uri.file(path.join(extensionPath, 'designer', 'fonts')),
                vscode.Uri.file(path.join(extensionPath, 'designer', 'scripts'))
            ]
        });

        ALPanel.currentPanel = new ALPanel(panel, extensionPath, mode);
        ALPanel.currentPanel.objectInfo = objectInfo;
    }

    private constructor(
        panel: vscode.WebviewPanel,
        extensionPath: string,
        mode: ALObjectDesigner.PanelMode
    ) {
        this._panel = panel;
        this._extensionPath = extensionPath;
        this.panelMode = mode;

        // Set the webview's initial html content 
        this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content based on view changes
        /*this._panel.onDidChangeViewState(e => {
            if (this._panel.visible) {
                this._update()
            }
        }, null, this._disposables);*/

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(async (messages) => {
            let handler: ALCommandHandler = new ALCommandHandler(this, extensionPath);
            
            for (let i = 0; i < messages.length; i++) {
                const message = messages[i];

                if (message.Command == 'Refresh') {
                    await this._update();
                    return;
                }
                    
                await handler.dispatch(message);                    
            }
        }, null, this._disposables);

        let watcher = vscode.workspace.createFileSystemWatcher('**/*.al');
        watcher.onDidCreate(async (e: vscode.Uri) => {
            if (e.fsPath.indexOf('.vscode') == -1) {
                await this._update();
            }
        });

        watcher.onDidChange(async (e: vscode.Uri) => {
            if (e.fsPath.indexOf('.vscode') == -1) {
                await this._update();
            }
        });

        watcher.onDidDelete(async (e: vscode.Uri) => {
            if (e.fsPath.indexOf('.vscode') == -1) {
                await this._update();
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

    private async _update() {
        //this._panel.title = this.panelMode == "List" ? "AL Object Designer" : `AL Designer: ${this._panel.objectInfo.Type} ${this.objectInfo.Id} ${this.objectInfo.Name}`;        
        if (!this._panel.webview.html)
            this._panel.webview.html = await this._getHtmlForWebview();

        if (this.panelMode == "List") {            
            let objectCollector = new ALObjectCollector();
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

            this._panel.webview.postMessage({ command: 'data', data: this.objectList, 'customLinks': links, 'events': this.eventList });
        } else {
            let parsedObj = new ALObjectParser(this.objectInfo);
            await parsedObj.create();
            this.objectInfo.ParsedObject = parsedObj.fields;
            this.objectInfo.Symbol = await parsedObj.parse(this.objectInfo.FsPath);
            this.objectInfo.SubType = parsedObj.subType;

            this._panel.webview.postMessage({ command: 'designer', objectInfo: this.objectInfo });
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

        return content;
    }
}