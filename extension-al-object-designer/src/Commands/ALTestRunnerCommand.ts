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
        let alTestRunnerExt = vscode.extensions.getExtension('jamespearson.al-test-runner');
        if (!alTestRunnerExt) {
            await vscode.window.showErrorMessage(`AL Test Runner extension is not installed or disabled.`);
        }

        let lastFilename = '';
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
                        alTestRunnerExt!.exports.getWorkspaceFolder = () => {
                            return info.fsPath;
                        };

                        await vscode.commands.executeCommand('altestrunner.runAllTests', info.settings.id, info.settings.name);
                    }
                }
            }
        } else {
            let projectInfo = this._projectCollector.getProjectFromObjectPath(fileName);

            alTestRunnerExt!.exports.getWorkspaceFolder = () => {
                return projectInfo.fsPath;
            };

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
}