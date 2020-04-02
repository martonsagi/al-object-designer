import * as vscode from 'vscode';
import * as path from 'path';
import * as utils from '../../utils';
import { ALPanel } from "../../ALPanel";
import { ALCommandBase } from "./ALCommandBase";
import { ALSettings } from '../../ALSettings';
import { platform } from 'os';

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

        let createFile: boolean = message.EventData.SymbolData?.SymbolZipPath == "" || message.Command == 'Run';
        let fname = "";

        let vsUri;
        if (createFile) {
            fname = path.join((vscode.workspace as any).workspaceFolders[0].uri.fsPath, '.vscode', `.alcache`, `Opening_${Date.now()}.al`);
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
                let launchUrl = settings.getUrl(message.Type, message.Id);

                await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(launchUrl));
            } else {
                await vscode.commands.executeCommand('crs.RunCurrentObjectWeb');
            }
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            if (createFile) {
                await this.deleteFile(fname);
            }
        } else {
            if (message.FsPath != "") {
                let newDoc = await vscode.workspace.openTextDocument(message.FsPath);
                vscode.window.showTextDocument(newDoc, vscode.ViewColumn.One);
            } else {
                if (createFile) {
                    if (["win32", "darwin"].indexOf(platform()) === -1) {
                        await vscode.window.showWarningMessage(`${message.Type} ${message.Name}: Go to definition is not support on '${platform()}' platform.`);
                    } else {
                        await vscode.commands.executeCommand('editor.action.revealDefinition').then(async () => {
                            if (createFile) {
                                await this.deleteFile(fname);
                            }
                        });
                    }
                } else {
                    let uri = vscode.Uri.parse(`alObjectDesignerDal://symbol/${message.Type}${message.Id > 0 ? ` ${message.Id} ` : ''}${message.Name.replace(/\//g, "_")} - ${message.EventData.Application}.al#${JSON.stringify(message.EventData.SymbolData)}`);
                    let doc = await vscode.workspace.openTextDocument(uri); // calls back into the provider
                    await vscode.window.showTextDocument(doc, { preview: true, viewColumn: vscode.ViewColumn.Active });
                }
            }
        }
    }

    private async deleteFile(name: string) {
        try {
            await utils.unlink(name);
        } catch (e) {
            console.log(e);
        }
    }
}