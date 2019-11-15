import * as vscode from 'vscode';
import { ALPanel } from "../ALPanel";
import { ALCommandBase } from "./Base/ALCommandBase";

export class AZWizardCommand extends ALCommandBase {

    public constructor(lObjectDesigner: ALPanel, lExtensionPath: string) {
        super(lObjectDesigner, lExtensionPath);
    }

    async execute(message: any) {
        let checkExt = vscode.extensions.getExtension('andrzejzwierzchowski.al-code-outline');
        if (!checkExt) {
            await vscode.window.showErrorMessage(`AZ AL Dev Tools extension is not installed or disabled.`);
        }

        (checkExt as any).activate();

        vscode.commands.executeCommand('azALDevTools.newALFile');

        return;
    }
}