import * as vscode from 'vscode';
import * as path from 'path';
import * as utils from '../../utils';
import { ALPanel } from "../../ALPanel";
import { ALCommandBase } from "./ALCommandBase";
import { ALSettings } from '../../ALSettings';
import { platform } from 'os';
import { ALObjectDesigner } from '../../ALModules';

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

        let objectRow = ALPanel.objectList!.find(f => f.Type == message.Type && f.Name == message.Name) as ALObjectDesigner.CollectorItem;

        let createFile: boolean = !objectRow.SymbolData?.SymbolZipPath || objectRow.SymbolData?.SymbolZipPath == "" || message.Command == 'Run';
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
            if (objectRow.FsPath != "") {
                let newDoc = await vscode.workspace.openTextDocument(objectRow.FsPath);
                vscode.window.showTextDocument(newDoc, vscode.ViewColumn.One);
            } else {
                if (createFile) {
                    if (["win32", "darwin"].indexOf(platform()) === -1) {
                        await vscode.window.showWarningMessage(`${objectRow.Type} ${objectRow.Name}: couldn't find definition on this '${platform()}' platform.`);
                    } else {
                        if (this._vsSettings.useInternalNavigation === true) {
                            if (createFile) {
                                await this.deleteFile(fname);
                            }
                            await vscode.window.showErrorMessage(`${objectRow.Type} ${objectRow.Name}: couldn't find definition.`);
                        } else {
                            try {
                                vscode.commands.executeCommand('editor.action.revealDefinition')
                                    .then(() => {
                                        if (createFile) {
                                            this.deleteFile(fname);
                                        }
                                    });
                            }
                            catch (e) {
                                await vscode.window.showErrorMessage(`${objectRow.Type} ${objectRow.Name}: couldn't find definition.`);
                                if (createFile) {
                                    await this.deleteFile(fname);
                                }
                            }
                        }
                    }
                } else {
                    let uri = vscode.Uri.parse(`alObjectDesignerDal://symbol/${objectRow.Type}${objectRow.Id > 0 ? ` ${objectRow.Id} ` : ''}${objectRow.Name.replace(/\//g, "_")} - ${objectRow.Application}.al#${JSON.stringify({Type: objectRow.Type, Name: objectRow.Name})}`);
                    let doc = await vscode.workspace.openTextDocument(uri); // calls back into the provider
                    await vscode.window.showTextDocument(doc, { preview: true, viewColumn: vscode.ViewColumn.Beside });
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