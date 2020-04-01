import * as vscode from 'vscode';
import { ALPanel } from "../ALPanel";
import { ALCommandBase } from "./Base/ALCommandBase";
import { ALProjectCollector } from '../ALProjectCollector';
import { read, getVsConfig } from '../utils';
import { join } from 'path';

export class ALTestRunnerCommand extends ALCommandBase {

    private _projectCollector: ALProjectCollector;
    private _vsSettings: any;

    public constructor(lObjectDesigner: ALPanel, lExtensionPath: string) {
        super(lObjectDesigner, lExtensionPath);
        this._projectCollector = new ALProjectCollector();
        this._vsSettings = getVsConfig();
    }

    async execute(message: any) {
        if (this._vsSettings.useALTestRunner === false) {
            await vscode.window.showInformationMessage(`Integration with AL Test Runner is not enabled. Set 'useALTestRunner' flag to true.`);
            return;
        }

        let alTestRunnerExt = vscode.extensions.getExtension('jamespearson.al-test-runner');
        if (!alTestRunnerExt) {
            await vscode.window.showErrorMessage(`AL Test Runner extension is not installed or disabled.`);
        }

        let lastFilename = '';
        let testRunnerAPIAvailable = alTestRunnerExt!.exports ? true : false;

        if (testRunnerAPIAvailable) {
            alTestRunnerExt!.exports.onOutputTestResults = (context: any) => {
                //console.log('Test Runner updated', context.event, context.filename);

                if (lastFilename === 'last.xml' && context.filename !== lastFilename) {
                    lastFilename = context.filename;
                    console.log('AL Test Runner finished.');
                    alTestRunnerExt!.exports.getWorkspaceFolder = undefined;
                } else {
                    lastFilename = context.filename;
                }
            };
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
                        if (testRunnerAPIAvailable) {
                            alTestRunnerExt!.exports.getWorkspaceFolder = () => {
                                return info.fsPath;
                            };
                        } else {
                            let appFilename = join(info.fsPath, 'app.json');
                            await this.openTextEditor(appFilename);
                        }

                        await vscode.commands.executeCommand('altestrunner.runAllTests', info.settings.id, info.settings.name);
                    }
                }
            }
        } else {
            let projectInfo = this._projectCollector.getProjectFromObjectPath(fileName);

            if (testRunnerAPIAvailable) {
                alTestRunnerExt!.exports.getWorkspaceFolder = () => {
                    return projectInfo.fsPath;
                };
            } else {
                await this.openTextEditor(fileName);
            }

            if (functionName) {
                let contents = await read(fileName) as string;
                let position = contents.indexOf(functionName);
                if (position != -1) {
                    await vscode.commands.executeCommand('altestrunner.runTest', fileName, position, projectInfo.id, projectInfo.name);
                } else {
                    await vscode.window.showErrorMessage(`Unable to run test: ${functionName} could not be found in ${fileName}`);
                }
            } else {
                await vscode.commands.executeCommand('altestrunner.runTestsCodeunit', projectInfo.id, projectInfo.name);
            }
        }
    }

    private async openTextEditor(filename: string): Promise<void> {
        let editor: vscode.TextEditor = vscode.window.visibleTextEditors.find(f => f.document.uri.fsPath == filename) as vscode.TextEditor;
        if (!editor) {
            let newDoc = await vscode.workspace.openTextDocument(filename);
            await vscode.window.showTextDocument(newDoc, vscode.ViewColumn.Two, false);
        } else {
            await vscode.window.showTextDocument(editor.document.uri, { preserveFocus: false, viewColumn: vscode.ViewColumn.Two });
        }

    }
}