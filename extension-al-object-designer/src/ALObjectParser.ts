import * as utils from './utils';
import { ALObjectDesigner, ALSymbolPackage } from './ALModules';
import ALObject = ALSymbolPackage.ALObject;
import ObjectRegion = ALObjectDesigner.ParsedObjectRegion;
import ObjectProperty = ALSymbolPackage.Property;
const balanced = require('balanced-match');

export class ALObjectParser implements ALObjectDesigner.ObjectParser {

    protected sourceObject: any;
    protected destinationObject: any
    public type: string = "";
    public name: string = "";
    public fields: Array<any> = [];
    public subType: string = "";

    private alTypes = [
        "Table",
        "Page",
        "Report",
        "Codeunit",
        "Query",
        "XmlPort",
        "Profile",
        "PageExtension",
        "PageCustomization",
        "TableExtension",
        "ControlAddIn",
        "Enum",
        "DotNetPackage"
    ];

    public constructor(sourceObj: any, destType: any) {
        this.sourceObject = sourceObj;
        this.destinationObject = destType;
    }

    public async create() {
        await this.parseSourceObject();
    }

    public async parse(filePath: string) {
        let result: ALObject = new ALObject();
        let fileContent: string = await utils.read(filePath) as string;
        let matches: Array<any> = this.recursiveMatch({ body: fileContent });
        result = this.generateSymbol(matches[0]);

        //console.log(JSON.stringify(result));

        return result;
    }

    private recursiveMatch(match: any) {
        let matches: Array<any> = [];

        match = balanced('{', '}', match.body);
        if (match) {
            let result: ObjectRegion = new ObjectRegion();

            let lines: Array<string> = match.pre.trim().split('\r\n'),
                lastLine = lines.pop();

            let regionInfo: any = this.processRegion(lastLine as string);

            result.Region = regionInfo.Region;
            result.Id = regionInfo.Id;
            result.Name = regionInfo.Name;
            result.Type = regionInfo.Type;
            result.Source = lastLine;

            let match2 = balanced('{', '}', match.body);
            let isField = result.Region.indexOf('field') != -1;
            if (match2 || isField) {
                let lines2: Array<string> = (isField ? match.body : match2.pre).trim().split('\r\n');
                result.Properties = lines2
                    .map((l): ObjectProperty | null => {
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

    private processRegion(region: string): ObjectRegion {
        region = region.trim();
        let pattern = /([aA-zZ]+)\((.*)\)/g;
        let namePattern = /([a-z]+)\s([0-9]+)\s(.*)/m;

        let match = utils.getAllMatches(namePattern, region);
        if (match.length > 0) {
            // process object props
            return {
                Region: match[0][1],
                Name: match[0][3].replace(/"/g, '').trim(),
                Type: match[0][1],
                Id: Number.parseInt(match[0][2])
            };
        } else {
            match = utils.getAllMatches(pattern, region);
            if (match.length > 0) {
                //process region

                return {
                    Region: match[0][1],
                    Name: match[0][2].replace(/"/g, '').trim(),
                    Type: "",
                    Id: 0
                };
            }
        }

        return {
            Region: region,
            Name: "",
            Type: "",
            Id: 0
        };
    }

    private generateSymbol(metadata: ObjectRegion): ALObject {
        let result = new ALObject();
        result.Id = metadata.Id as number;
        result.Name = metadata.Name as string;
        result.Type = metadata.Type as string;
        result.Properties = metadata.Properties as Array<ObjectProperty>;

        switch (result.Type) {
            case 'page':
                let obj = result as ALSymbolPackage.Page;
                obj.Controls = [];
                obj.Actions = [];
                for (let child of metadata.Children as Array<ObjectRegion>) {
                    let isActions = child.Region == 'actions';
                    let container = isActions ? "Actions" : "Controls";
                    obj[container] = this.processSymbol(obj, container, child);
                }

                result = obj;
                break;
        }

        return result;
    }

    private processSymbol(alObject: ALObject, container: string, metadata: ObjectRegion, parent?: ALSymbolPackage.PageControlBase): any {
        let result: any;
        switch (alObject.Type) {
            case 'page':
                result = [];
                let count = (metadata.Children || []).length;
                let separator = Math.ceil(count / 2);
                if (separator == 0) {
                    separator = count;
                }
                let i = 0;
                for (let child of metadata.Children as Array<ObjectRegion>) {
                    i++;
                    let control: any = {};
                    control.Parent = Object.assign({}, parent);
                    delete control.Parent['Controls'];
                    delete control.Parent['Actions'];
                    delete control.Parent['Parent'];

                    if ((count % 2 == 0 && i >= separator) ||
                        (count % 2 != 0 && i >= separator + 1)) {
                        control.Separator = true;
                    } else {
                        control.Separator = control.Parent.Separator === true;
                    }

                    control.ControlType = child.Region;
                    control.SourceCodeAnchor = child.Source || '';
                    control.SourceExpression = '';
                    if (['field', 'part'].indexOf(control.ControlType) != -1) {
                        let fieldData = (child.Name as string).split(';');
                        control.Name = fieldData[0].trim();
                        control.SourceExpression = fieldData[1].trim();
                    } else {
                        control.Name = utils.toUpperCaseFirst(child.Name as string);
                    }
                    control.Properties = child.Properties as Array<ObjectProperty>;
                    let caption = control.Properties ? control.Properties.filter((f: any) => f.Name == 'Caption') : [];
                    if (caption.length > 0) {
                        control.Caption = caption[0].Value.replace(/'/g, '').trim();
                    } else {
                        control.Caption = control.Name.replace(/"/g, '').trim();
                    }
                    control[container] = this.processSymbol(alObject, container, child, control);
                    result.push(control);
                }
                break;
        }

        return result;
    }

    private async parseSourceObject() {
        //let debug = await this.parse(this.sourceObject.FsPath);

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