import * as utils from './utils';

export class ALObjectCreator {

    protected sourceObject: any;
    protected destinationObject: any
    public type: string = "";
    public name: string = "";
    public fields: Array<any> = [];
    public subType: string = "";

    public constructor(sourceObj: any, destType: any) {
        this.sourceObject = sourceObj;
        this.destinationObject = destType;
    }

    public async create()
    {
        await this.parseSourceObject();
    }
    
    private async parseSourceObject()
    {
        let file: any = await utils.read(this.sourceObject.FsPath);
        let typeRegex = /([a-z]+)\s([0-9]+)\s(.*)/m;
        let result = file.match(typeRegex);

        if (result.length < 3) {
            return;
        }

        this.type = result[1];
        this.name = result[3].replace(/"/g, '');

        if (this.type == 'table' || this.type == "page") {
            let fieldRegex = /(field)\((.*)\)/gm;
            let result: any = utils.getAllMatches(fieldRegex, file);
            let pageType: any = utils.getAllMatches(/PageType\s=\s(.*);/g, file);
            this.subType = pageType.length > 0 ? pageType[0][1] : '';
            
            for (let i = 0; i < result.length; i++) {
                const element = result[i];
                let parts = element[2].split(";");
                this.fields.push(parts[1].replace(/"/g, '').trim());
            }
        }        
    }


}