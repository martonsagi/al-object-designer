import { ALPanel } from "../ALPanel";
import { ALCommandBase } from "./Base/ALCommandBase";
import * as vscode from 'vscode';
import * as utils from '../utils';

export class ExportCsvCommand extends ALCommandBase {

    public constructor(lObjectDesigner: ALPanel, lExtensionPath: string) {
        super(lObjectDesigner, lExtensionPath);
        this.showInfo = false;
    }

    async execute(message: any) {
        let data = message.EventData.Data;
        let saveUri = await vscode.window.showSaveDialog({ filters: { 'CSV': ['csv'] } }) as vscode.Uri;
        await utils.write(saveUri.fsPath, data);

        return;
    }
}