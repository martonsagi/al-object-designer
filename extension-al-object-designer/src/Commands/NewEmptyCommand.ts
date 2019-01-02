import * as vscode from 'vscode';
import { ALPanel } from "../ALPanel";
import { ALCommandBase } from "./Base/ALCommandBase";

export class NewEmptyCommand extends ALCommandBase {

    public constructor(lObjectDesigner: ALPanel, lExtensionPath: string) {
        super(lObjectDesigner, lExtensionPath);
    }

    async execute(message: any) {
        let newDoc = await vscode.workspace.openTextDocument({ language: 'al', content: '' });
        await vscode.window.showTextDocument(newDoc);

        return;
    }
}