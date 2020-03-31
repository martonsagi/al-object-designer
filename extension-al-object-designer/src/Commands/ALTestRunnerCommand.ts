import * as vscode from 'vscode';
import { ALPanel } from "../ALPanel";
import { ALCommandBase } from "./Base/ALCommandBase";
import { ALProjectCollector } from '../ALProjectCollector';
import { read } from '../utils';
import { join } from 'path';

export class ALTestRunnerCommand extends ALCommandBase {

    private _projectCollector: ALProjectCollector;

    public constructor(lObjectDesigner: ALPanel, lExtensionPath: string) {
        super(lObjectDesigner, lExtensionPath);
        this._projectCollector = new ALProjectCollector();
    }

    async execute(message: any) {
        //TODO:
        //await vscode.window.showInformationMessage(`Integration with AL Test Runner extension is under development. Try again in the next release! :)`);
        //return;

        let checkExt = vscode.extensions.getExtension('jamespearson.al-test-runner');
        if (!checkExt) {
            await vscode.window.showErrorMessage(`AL Test Runner extension is not installed or disabled.`);
        }

        let allTests = message.EventData.AllTests === true;
        let fileName = message.FsPath;
        let functionName = message.EventData.EventName;

        await this._projectCollector.init();

        if (allTests === true) {
            let testObjects = ALPanel.eventList!.filter(f => f.EventType == 'Test');
            if (testObjects.length == 0) {

            } else {
                let projects = [...new Set(testObjects.map(item => item.Application))];
                for (let project of projects) {
                    let info = this._projectCollector.projects.find(f => f.settings.name == project);
                    if (info) {
                        checkExt!.exports.getWorkspaceFolder = () => {
                            return info.fsPath;
                        };

                        //let doc = await vscode.workspace.openTextDocument(join(info.fsPath, 'app.json'));
                        //let editor = await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside, true);
                        await vscode.commands.executeCommand('altestrunner.runAllTests', info.settings.id, info.settings.name);
                        //await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                    }
                }
            }

            //ALPanel.showPanel();
        } else {
            let projectInfo = this._projectCollector.getProjectFromObjectPath(fileName);

            checkExt!.exports.getWorkspaceFolder = () => {
                return projectInfo.fsPath;
            };

            if (functionName) {
                let contents = await read(fileName) as string;
                let position = contents.indexOf(functionName);
                if (position != -1) {
                    //let doc = await vscode.workspace.openTextDocument(fileName);
                    //let editor = await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside, false);
                    await vscode.commands.executeCommand('altestrunner.runTest', fileName, position, projectInfo.id, projectInfo.name);
                } else {
                    await vscode.window.showErrorMessage(`Unable to run test: ${functionName} could not be found in ${fileName}`);
                }
            } else {
                await vscode.commands.executeCommand('altestrunner.runTestsCodeunit', projectInfo.id, projectInfo.name);
            }
        }        
    }
}