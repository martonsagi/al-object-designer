import { workspace, Uri } from 'vscode';

export class ALSettings {

    private _settings: any = {};

    public constructor(uri?: Uri) {
        let config = workspace.getConfiguration('launch', uri);
        this._settings = (config.get('configurations') as Array<any>)[0];
    }

    public get(key: string): any {
        return this._settings[key] || '';
    }

    public getUrl(type: string, id: number): string {
        let server = this.get('server'),
            instance = this.get('serverInstance');

        server = server[server.length - 1] != '/' ? server + '/' : server;
        let launchUrl = `${server}${instance}/?${type.toLowerCase()}=${id}`;

        return launchUrl;
    }
}