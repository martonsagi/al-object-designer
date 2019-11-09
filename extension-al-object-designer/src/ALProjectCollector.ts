import { workspace } from 'vscode';
import * as path from 'path';
const fs = require('fs-extra');

export class ALProjectCollector {
    
    projects: Array<any> = [];
    
    constructor() {

    }

    async init() {
        this.projects = await this.getWorkspaceJsonFiles();
    }

    async getWorkspaceJsonFiles() {
        let files = await workspace.findFiles('**/app.json');

        let result = [];
        for (let app of files) {
            let appSettings: any = await fs.readJson(app.fsPath);
            let project = {
                fsPath: app.fsPath.replace('app.json', ''),
                settings: appSettings
            }
            result.push(project);
        }

        return result;
    }

    getProjectFromObjectPath(objPath: string) {
        let info = this.projects.find(f => objPath.indexOf(f.fsPath) !== -1);
        if (info) {
            return info.settings;
        }

        return {};
    }
}