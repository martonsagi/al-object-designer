'use strict';

import * as vscode from 'vscode';
import { ALPanel } from './ALPanel';
import { ALObjectDesigner } from './ALModules';
import querystring = require('querystring');
import { ALTableGenerator } from './ALTableGenerator';

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('extension.openALWindow', async () => {
        try {
            await ALPanel.open(context.extensionPath, ALObjectDesigner.PanelMode.List);
        } catch (e) {
            console.error(e);
            vscode.window.showErrorMessage(`AL Object Designer could not be opened. Error: '${e.message}'`);
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.openALDesignWindow', async () => {
        try {
            await ALPanel.openDesigner(context.extensionPath);
        } catch (e) {
            console.error(e);
            vscode.window.showErrorMessage(`AL Page Designer could not be opened. Error: '${e.message}'`);
        }
    }));

    context.subscriptions.push(vscode.window.registerUriHandler(<vscode.UriHandler>{
        async handleUri(uri: vscode.Uri) {
            let q = querystring.parse(uri.query);
            q.FsPath = "";
            await ALPanel.command(context.extensionPath, q);
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.generateALTables', async () => {
        try {
            let generator = new ALTableGenerator();
            await generator.generate();
        } catch (e) {
            console.error(e);
            vscode.window.showErrorMessage(`AL Table Generator could not be opened. Error: '${e.message}'`);
        }
    }));

}

// this method is called when your extension is deactivated
export function deactivate() {
    (ALPanel.currentPanel as ALPanel).dispose();
}