import { workspace } from 'vscode';
import * as path from 'path';
import * as utils from './utils';
import { ALObjectDesigner } from './ALModules';
const fs = require('fs-extra');
const firstBy = require('thenby');

export class ALTemplateCollector implements ALObjectDesigner.TemplateCollector {
    protected extensionPath: string = '';

    constructor(lExtensionPath: string) {
        this.extensionPath = lExtensionPath;
    }

    public async initialize() {
        let root = (workspace as any).workspaceFolders[0];
        let fPath = path.join(root.uri.fsPath, '.vscode', '.altemplates', path.sep);
        let exists = await utils.folderExists(fPath);

        // migrate old template folder: as of v0.2.0
        let oldPath = path.join(root.uri.fsPath, '.altemplates', path.sep);
        if (await utils.folderExists(oldPath)) {
            await utils.copyFiles(oldPath, fPath);
        }
        
        if (exists == false) {
            let source = path.join(this.extensionPath, 'altemplates', path.sep);
            await utils.copyFiles(source, fPath);
            await fs.remove(oldPath);
        }
    }

    public async discover() {
        let fpaths: any = (workspace as any).workspaceFolders,
            templates: Array<ALObjectDesigner.TemplateItem> = [];

        for (let i = 0; i < fpaths.length; i++) {
            const wkspace = fpaths[i];
            let fpath: any = path.join(wkspace.uri.fsPath, '.vscode', '.altemplates', path.sep);
            let exists = await utils.folderExists(fpath);
            if (exists === true) {
                let items: any = await utils.readDir(fpath);
                items = items.filter((f: string) => f.endsWith('.json'));

                let files: Array<ALObjectDesigner.TemplateItem> = items.map(async (f: any) => {
                    let fp = path.join(fpath, f);
                    let content: any = await utils.read(fp);
                    content = JSON.parse(content);
                    content.path = fp;

                    return content;
                });

                templates = templates.concat(await Promise.all(files));
            }
        }

        templates.sort(firstBy('position'));

        return templates;
    }
}