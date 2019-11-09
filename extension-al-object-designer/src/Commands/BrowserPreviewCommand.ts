import * as vscode from 'vscode';
import { ALPanel } from "../ALPanel";
import { ALCommandBase } from "./Base/ALCommandBase";
import { ALObjectDesigner } from '../ALModules';

export class BrowserPreviewCommand extends ALCommandBase {

    public constructor(lObjectDesigner: ALPanel, lExtensionPath: string) {
        super(lObjectDesigner, lExtensionPath);
    }

    async execute(message: any) {
        if (['Table','Page','PageExtension','TableExtension','Report'].indexOf(message.Type) == -1) {
            await vscode.window.showErrorMessage(`${message.Type} objects cannot be run in Modern Client.`)
            return;
        }

        let type = (message.Type as string).replace('Extension', '');
        let objectId = message.Id;
        switch(message.Type) {
            case 'TableExtension':
            case 'PageExtension':
                let sourceObject = message.Objects.find((f: any) => f.Name == message.TargetObject && f.Type == type);
                if (sourceObject) {
                    objectId = sourceObject.Id;
                }
                break;
        }

        // TODO
        vscode.commands.executeCommand('browser-preview.openPreview', `http://bc-test/NAV/?${type.toLocaleLowerCase()}=${objectId}`);
    }
}