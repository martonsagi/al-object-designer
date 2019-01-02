import * as vscode from 'vscode';
import * as utils from '../utils';
import { ALPanel } from "../ALPanel";
import { ALCommandBase } from "./Base/ALCommandBase";

export class NewCustomSnippetCommand extends ALCommandBase {

    public constructor(lObjectDesigner: ALPanel, lExtensionPath: string) {
        super(lObjectDesigner, lExtensionPath);
    }

    async execute(message: any) {
        let newDoc = await vscode.workspace.openTextDocument({ language: 'al', content: '' });
        let editor = await vscode.window.showTextDocument(newDoc);

        let snippet: any = await utils.read(message.FsPath);
        snippet = JSON.parse(snippet);
        editor.insertSnippet(new vscode.SnippetString(snippet.body.join("\r\n")));

        return;
    }
}