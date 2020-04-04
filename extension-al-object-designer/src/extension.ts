'use strict';

import { DalDefinitionProvider } from './DalDefinitionProvider';
import { ALObjectCollectorCache } from './ALObjectCollectorCache';
import * as vscode from 'vscode';
import { ALPanel } from './ALPanel';
import { ALObjectDesigner } from './ALModules';
import querystring = require('querystring');
import { ALTableGenerator } from './ALTableGenerator';
import { DalDocumentProvider } from './DalDocumentProvider';
import { getVsConfig } from './utils';

// this method is called when your extension is activated
export async function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('alObjectDesigner.openALWindow', async () => {
        try {
            await ALPanel.open(context.extensionPath, ALObjectDesigner.PanelMode.List);
        } catch (e) {
            console.error(e);
            vscode.window.showErrorMessage(`AL Object Designer could not be opened. Error: '${e.message}'`);
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('alObjectDesigner.openALDesignWindow', async () => {
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

    context.subscriptions.push(vscode.commands.registerCommand('alObjectDesigner.generateALTables', async () => {
        try {
            let generator = new ALTableGenerator();
            await generator.generate();
        } catch (e) {
            console.error(e);
            vscode.window.showErrorMessage(`AL Table Generator could not be opened. Error: '${e.message}'`);
        }
    }));


    context.subscriptions.push(vscode.commands.registerCommand('alObjectDesigner.clearCache', async () => {
        try {
            let collectorCache = new ALObjectCollectorCache();
            await collectorCache.clearCache();
            vscode.window.showInformationMessage(`AL Object Designer cache deleted.`);
        } catch (e) {
            console.error(e);
            vscode.window.showErrorMessage(`AL Object Designer Cache cannot be deleted: ${e.message}`);
        }
    }));

    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('alObjectDesignerDal', new DalDocumentProvider()));
    context.subscriptions.push(vscode.languages.registerDefinitionProvider({ scheme: 'alObjectDesignerDal' }, new DalDefinitionProvider()));
    context.subscriptions.push(vscode.languages.registerDefinitionProvider({ scheme: 'al-preview' }, new DalDefinitionProvider()));

    let preloadTask = async() => {
        let vsSettings = getVsConfig();
        if (vsSettings.useInternalNavigation === true) {
            await ALPanel.preLoad();
        }
    };
    context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(preloadTask));

    await preloadTask();
}

// this method is called when your extension is deactivated
export function deactivate() {
    (ALPanel.currentPanel as ALPanel).dispose();
}
