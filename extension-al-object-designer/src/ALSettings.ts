import { workspace, Uri } from 'vscode';

export class ALSettings {

    private _settings: any = {};

    public constructor(uri?: Uri) {
        let config = workspace.getConfiguration('launch', uri);
        this._settings = (config.get('configurations') as Array<any>)[0];
    }

    public get(key: string): any
    {
        return this._settings[key] || '';
    }
}