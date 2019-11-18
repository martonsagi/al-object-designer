import * as vscode from 'vscode';
import * as path from 'path';
import * as utils from '../../utils';
import { ALPanel } from "../../ALPanel";
import { ALCommandBase } from "./ALCommandBase";
import { ALSettings } from '../../ALSettings';
import { settings } from 'cluster';

export class RunCommandBase extends ALCommandBase {

    private _vsSettings: any;

    public constructor(lObjectDesigner: ALPanel, lExtensionPath: string) {
        super(lObjectDesigner, lExtensionPath);
        this.showInfo = true;
        this._vsSettings = utils.getVsConfig();
    }

    async execute(message: any) {
        let objType: string = message.Type,
            notDefinition = message.Command != 'Definition';
        switch (objType.toLowerCase()) {
            case 'table':
                objType = 'Record';
                break;
        }

        let createFile: boolean = message.FsPath == "" || message.Command == 'Run';
        let fname = "";

        let vsUri;
        if (createFile) {
            fname = (vscode.workspace as any).workspaceFolders[0].uri.fsPath + path.sep + `.alcache` + path.sep + `Opening_${Date.now()}.al`;
            let snippet =
                `${notDefinition ? message.Type.toLowerCase() : "codeunit"} ${notDefinition ? message.Id : "99999999"} ${notDefinition ? '"' + message.Name + '"' : "Temp"} {
    var
        Lookup: ${objType} "${message.Name}";
}`
                ;
            await utils.write(fname, snippet);
            let newDoc = await vscode.workspace.openTextDocument(fname);
            let editor = await vscode.window.showTextDocument(newDoc);

            let pos = new vscode.Position(2, 18 + objType.length);
            editor.selection = new vscode.Selection(pos, pos);
            vsUri = newDoc.uri;
        }

        if (message.Command == 'Run') {
            let useCrs = this._vsSettings.useCRS === true && vscode.extensions.getExtension('crs.RunCurrentObjectWeb');
            if (useCrs === false) {
                let settings = new ALSettings(vsUri);
                /*let server = settings.get('server'),
                    instance = settings.get('serverInstance');

                server = server[server.length - 1] != '/' ? server + '/' : server;
                let launchUrl = `${server}${instance}/?${message.Type.toLowerCase()}=${message.Id}`;*/

                let launchUrl = settings.getUrl(message.Type, message.Id);

                await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(launchUrl));
            } else {                
                await vscode.commands.executeCommand('crs.RunCurrentObjectWeb');
            }
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        } else {
            if (message.FsPath != "") {
                let newDoc = await vscode.workspace.openTextDocument(message.FsPath);
                await vscode.window.showTextDocument(newDoc, vscode.ViewColumn.One);
            } else {
                let res: any = await vscode.commands.executeCommand('editor.action.goToDeclaration');
            }
        }

        if (createFile) {
            setTimeout(() => {
                try {
                    utils.unlink(fname);
                } catch (e) {
                    console.log(e);
                }
            }, 1000);
        }
    }
}