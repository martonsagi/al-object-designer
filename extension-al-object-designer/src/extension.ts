'use strict';

import * as vscode from 'vscode';
import { ALPanel } from './ALPanel';
import { ALObjectDesigner } from './ALModules';

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
}

// this method is called when your extension is deactivated
export function deactivate() {
}