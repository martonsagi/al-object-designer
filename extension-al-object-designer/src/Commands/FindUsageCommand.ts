import * as vscode from 'vscode';
import { ALPanel } from "../ALPanel";
import { ALCommandBase } from "./Base/ALCommandBase";
import { ALObjectDesigner } from '../ALModules';

export class FindUsageCommand extends ALCommandBase {

    public constructor(lObjectDesigner: ALPanel, lExtensionPath: string) {
        super(lObjectDesigner, lExtensionPath);
    }

    async execute(message: any) {
        let objEvent = message.EventData;
        let objectRow = ALPanel.objectList!.find(f => f.Type == message.Type && f.Name == message.Name) as ALObjectDesigner.CollectorItem;

        if (!objectRow) {
            vscode.window.showInformationMessage(`${objEvent.Type} ${objEvent.Id} ${objEvent.Name} - ${objEvent.EventName} could not be found.`);
            return;
        }

        let uri = vscode.Uri.parse(`alObjectDesignerDal://symbol/${objectRow.Type}${objectRow.Id > 0 ? ` ${objectRow.Id} ` : ''}${objectRow.Name.replace(/\//g, "_")} - ${objectRow.Application}.al#${JSON.stringify({ Type: objectRow.Type, Name: objectRow.Name })}`);
        let textDoc = await vscode.workspace.openTextDocument(uri);
        let editor = await vscode.window.showTextDocument(textDoc, { preview: true });
        let searchTerm = `${objEvent.EventName}(`;
        let eventStrPos = textDoc.getText().indexOf(searchTerm);
        if (eventStrPos != -1) {
            let pos = textDoc.positionAt(eventStrPos);
            let endpos = textDoc.positionAt(eventStrPos + searchTerm.length - 1);
            editor.selection = new vscode.Selection(pos, endpos);
            editor.revealRange(new vscode.Range(pos, endpos), vscode.TextEditorRevealType.InCenter);
        }

        vscode.window.showInformationMessage(`${objEvent.Type} ${objEvent.Id} ${objEvent.Name} - ${objEvent.EventName} opened.`);
    }
}