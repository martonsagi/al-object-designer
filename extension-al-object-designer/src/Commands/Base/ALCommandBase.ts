import * as vscode from 'vscode';
import { ALPanel } from "../../ALPanel";

export class ALCommandBase {
    message: any;

    protected objectDesigner: ALPanel;
    protected extensionPath: string = '';
    protected showInfo = false;

    constructor(lObjectDesigner: ALPanel, lExtensionPath: string) {
        this.objectDesigner = lObjectDesigner;
        this.extensionPath = lExtensionPath;
    }

    async execute(message: any): Promise<any> {

    }

    async showMessage(message: any) {
        if (this.showInfo === true)
            await vscode.window.showInformationMessage(`${message.Type} ${message.Id} ${message.Name} opened.`);
    }
}