import * as vscode from 'vscode';
import { ALPanel } from "../ALPanel";
import { ALCommandBase } from "./Base/ALCommandBase";

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
        let allTests = message.AllTests === true;
        let fileName = message.FsPath;
        let functionName = message.EventData.EventName;

        if (allTests === true) {
            vscode.commands.executeCommand('altestrunner.runAllTests', '', message.Application);
        } else {
            vscode.commands.executeCommand('altestrunner.runTest', fileName, functionName);
        }
    }
}