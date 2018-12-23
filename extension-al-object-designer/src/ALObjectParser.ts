import * as utils from './utils';
import { ALObjectDesigner, ALSymbolPackage } from './ALModules';
import ALObject = ALSymbolPackage.ALObject;
const balanced = require('balanced-match');

export class ALObjectParser implements ALObjectDesigner.ObjectParser {

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

    public async create() {
        await this.parseSourceObject();
    }

    public async parse(filePath: string) {

        let result: ALObject = new ALObject();

        let file: string = (await utils.read(filePath)) as string;

        let matches: Array<any> = this.recursiveMatch({ body: file });

        console.log(JSON.stringify(matches));

        return result;
    }

    private recursiveMatch(match: any) {
        let matches: Array<any> = [];

        match = balanced('{', '}', match.body);
        if (match) {
            let result: any = {
                Region: "",
                Properties: [],
                Children: []
            };

            let lines: Array<string> = match.pre.trim().split('\r\n');
            result.Region = lines.pop();

            let match2 = balanced('{', '}', match.body);
            let isField = result.Region.indexOf('field') != -1;
            if (match2 || isField) {
                let lines2: Array<string> = (isField ? match.body : match2.pre).trim().split('\r\n');
                result.Properties = lines2.map(l => {
                    let prop = l.split('=');
    
                    if (prop.length < 2) {
                        return null;
                    }
    
                    return {
                        Name: prop[0].trim(),
                        Value: prop[1].trim().replace(';', '')
                    }
                })
                .filter(f => {
                    return f !== null;
                });
            }
            
            result.Children = this.recursiveMatch(match);

            matches.push(result);

            if (match.post) {
                matches = matches.concat(this.recursiveMatch({ body: match.post }));
            }
        }

        return matches;
    }

    private async parseSourceObject() {
        let debug = await this.parse(this.sourceObject.FsPath);

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