import { CopyEventCommand } from './CopyEventCommand';
import * as vscode from 'vscode';
import { ALPanel } from "../ALPanel";
const clipboardy = require('clipboardy');

export class CopyEventsCommand extends CopyEventCommand {

    public constructor(lObjectDesigner: ALPanel, lExtensionPath: string) {
        super(lObjectDesigner, lExtensionPath);
    }

    async execute(message: any) {
        let objEvents = message.EventData as Array<any>;

        if (objEvents.length < 1) {
            await vscode.window.showInformationMessage(`No events were selected.`);
        }

        let snippets: Array<string> = objEvents.map(m => this.getEventSnippet(m));
        let eventSnippet = snippets.join("");

        await clipboardy.write(eventSnippet);

        await vscode.window.showInformationMessage(`${snippets.length} events copied to clipboard.`);
    }
}