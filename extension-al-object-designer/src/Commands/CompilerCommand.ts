import { ALPanel } from "../ALPanel";
import { ALCommandBase } from "./Base/ALCommandBase";
import * as vscode from 'vscode';

export class CompilerCommand extends ALCommandBase {

    public constructor(lObjectDesigner: ALPanel, lExtensionPath: string) {
        super(lObjectDesigner, lExtensionPath);
        this.showInfo = false;
    }

    async execute(message: any) {
        switch(message.Type) {
            case 'build':
                await vscode.commands.executeCommand('al.package');
                break;
            case 'run':
                await vscode.commands.executeCommand('al.publishNoDebug');
                break;
            case 'debug':
                await vscode.commands.executeCommand('al.publish');
                break;
        }

        return;
    }
}