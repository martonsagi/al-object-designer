import * as vscode from 'vscode';
import { ALPanel } from './ALPanel';
import { ALObjectDesigner } from './ALModules';
import { ALCommandBase } from './Commands/Base/ALCommandBase';

export class ALCommandHandler implements ALObjectDesigner.CommandHandler {
    message: any;

    protected objectDesigner: ALPanel;
    protected extensionPath: string = '';

    public constructor(lObjectDesigner: ALPanel, lExtensionPath: string) {
        this.objectDesigner = lObjectDesigner;
        this.extensionPath = lExtensionPath;
    }

    public async dispatch(message: any) {
        let className = `${message.Command}Command`;
        let handlerClass = require(`./Commands/${className}`);

        if (handlerClass) {
            let handler: ALCommandBase = new handlerClass[className](this.objectDesigner, this.extensionPath);
            await handler.execute(message);
            await handler.showMessage(message);
        } else {
            await vscode.window.showInformationMessage(`'${message.Command}' command was not found for ${message.Type} ${message.Id} ${message.Name}.`);
        }
    }

}