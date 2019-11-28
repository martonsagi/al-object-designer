import * as vscode from 'vscode';
import { ALPanel } from "../ALPanel";
import { ALCommandBase } from "./Base/ALCommandBase";
import { ALSettings } from '../ALSettings';

export class ALTestRunnerCommand extends ALCommandBase {

    public constructor(lObjectDesigner: ALPanel, lExtensionPath: string) {
        super(lObjectDesigner, lExtensionPath);
    }

    async execute(message: any) {
        let checkExt = vscode.extensions.getExtension('jamespearson.al-test-runner');
        if (!checkExt) {
            await vscode.window.showErrorMessage(`AL Test Runner extension is not installed or disabled.`);
        }

        // TODO:
        vscode.commands.executeCommand('altestrunner.runTest');
    }
}