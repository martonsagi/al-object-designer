import * as vscode from 'vscode';
import * as path from 'path';
import * as utils from '../../utils';
import { ALPanel } from "../../ALPanel";
import { ALCommandBase } from "./ALCommandBase";

export class RunCommandBase extends ALCommandBase {

    public constructor(lObjectDesigner: ALPanel, lExtensionPath: string) {
        super(lObjectDesigner, lExtensionPath);
        this.showInfo = true;
    }

    async execute(message: any) {
        let objType = message.Type,
            notDefinition = message.Command != 'Definition';
        switch (objType) {
            case 'Table':
                objType = 'Record';
                break;
        }

        let createFile: boolean = message.FsPath == "" || message.Command == 'Run';
        let fname = "";

        if (createFile) {
            fname = (vscode.workspace as any).workspaceFolders[0].uri.fsPath + path.sep + `.vscode` + path.sep + `Opening_${Date.now()}.al`;
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
        }

        if (message.Command == 'Run') {
            let res: any = await vscode.commands.executeCommand('crs.RunCurrentObjectWeb');
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