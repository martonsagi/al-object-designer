import * as utils from './utils';
import { ALObjectDesigner, ALSymbolPackage } from './ALModules';
import ALObject = ALSymbolPackage.ALObject;
import ObjectRegion = ALObjectDesigner.ParsedObjectRegion;
import ObjectProperty = ALSymbolPackage.Property;
import ParseMode = ALObjectDesigner.ParseMode;
import { ALObjectCollector } from './ALObjectCollector';
const balanced = require('balanced-match');

export class ALObjectParser implements ALObjectDesigner.ObjectParser {

    private _objectList: Array<ALObjectDesigner.CollectorItem> = [];

    public constructor() {
    }

    public static getSymbolProperty(symbol: ALSymbolPackage.ALObject, propertyName: string) {
        let property = symbol.Properties ? symbol.Properties.find((f: ALSymbolPackage.Property) => {
            return f.Name == propertyName
        }) : null;

        return property ? property.Value : null;
    }

    public async updateCollectorItem(collectorItem: ALObjectDesigner.CollectorItem) {
        collectorItem.Symbol = await this.parse(collectorItem);
        let subType = ALObjectParser.getSymbolProperty(collectorItem.Symbol, 'PageType') || 'Card';
        collectorItem.SubType = ["Document", "Card"].indexOf(subType) != -1 ? 'Card' : 'List';

        return collectorItem;
    }

    public async parse(options: any, mode?: ParseMode) {
        if (!mode) {
            if (options instanceof String) {
                mode = ParseMode.Text;
            } else if (options.FsPath && options.FsPath.length > 0) {
                mode = ParseMode.File;
            } else {
                mode = ParseMode.Symbol;
            }
        }

        let result: ALObject = new ALObject();

        switch (mode) {
            case ParseMode.File:
                result = await this.parseFile(options.FsPath);
                break;
            case ParseMode.Text:
                result = await this.parseText(options);
                break;
            case ParseMode.Symbol:
                result = await this.parseSymbol(options) || result;
                break;
        }

        return result;
    }

    public async parseFile(filePath: string) {
        let fileContent: string = await utils.read(filePath) as string,
            result: ALObject = new ALObject();

        result = await this.parseText(fileContent);
        return result;
    }

    public async parseFileBase(filePath: string) {
        let fileContent: string = await utils.read(filePath) as string,
            result: ALObject = new ALObject();

        result = this.parseTextBase(fileContent);
        return result;
    }

    public async parseText(fileContent: string) {
        let result: ALObject = new ALObject();
        let matches: Array<any> = this.recursiveMatch({ body: fileContent });
        result = await this.generateSymbol(matches[0]);

        return result;
    }

    public parseTextBase(fileContent: string) {
        let result: ALObject = new ALObject();
        let matches: Array<any> = this.recursiveMatch({ body: fileContent });
        result = this.generateSymbolBase(matches[0]);

        return result;
    }

    public async parseSymbol(objectInfo: ALObjectDesigner.CollectorItem) {
        let collector = new ALObjectCollector();
        this._objectList = await collector.discover();
        let result = this._objectList.find(f => {
            return (f.Id == objectInfo.Id && f.Type.toLowerCase() == objectInfo.Type.toLowerCase())
                || (f.Name == objectInfo.Name && f.Type.toLowerCase() == objectInfo.Type.toLowerCase());
        });

        if (result) {
            let symbolData = result.SymbolData;
            if (symbolData) {
                let symbol = await collector.getSymbolReference(symbolData);
                return symbol;
            } else {
                let localSymbol = await this.parse(result);
                return localSymbol;
            }
        }

        return null;
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

    private generateSymbolBase(metadata: ObjectRegion): ALObject {
        let result = new ALObject();
        result.Id = metadata.Id as number;
        result.Name = metadata.Name as string;
        result.Type = metadata.Type as string;
        result.Properties = metadata.Properties as Array<ObjectProperty>;

        return result;
    }

    private async generateSymbol(metadata: ObjectRegion): Promise<ALObject> {
        let result = this.generateSymbolBase(metadata);

        switch (result.Type) {
            case 'page':
                let obj = result as ALSymbolPackage.Page;
                obj.Controls = [];
                obj.Actions = [];
                for (let child of metadata.Children as Array<ObjectRegion>) {
                    let isActions = child.Region == 'actions';
                    let container = isActions ? "Actions" : "Controls";
                    obj[container] = await this.processSymbol(obj, container, child);
                }

                result = obj;

                let sourceTable: string = ALObjectParser.getSymbolProperty(result, 'SourceTable') as string;
                sourceTable = sourceTable.replace(/"/g, '').trim();
                let sourceTableInfo = {
                    Name: sourceTable, 
                    Type: 'Table'
                } as ALObjectDesigner.CollectorItem;
                result.SourceTable = await this.parseSymbol(sourceTableInfo);        
                break;
            case 'table':
                let table = result as ALSymbolPackage.Table;
                table.Fields = [];
                table.Keys = [];
                table.FieldGroups = [];
                for (let child of metadata.Children as Array<ObjectRegion>) {
                    let isGroup = ['fields', 'keys'].indexOf(child.Region) != -1;
                    if (isGroup) {
                        let container = utils.toUpperCaseFirst(child.Region);
                        table[container] = await this.processSymbol(table, container, child);
                    }
                }

                result = table;
                break;
        }

        return result;
    }

    private async processSymbol(alObject: ALObject, container: string, metadata: ObjectRegion, parent?: ALSymbolPackage.PageControlBase): Promise<any> {
        let result: any = [];
        let i = 0;
        let count = (metadata.Children || []).length;
        let separator = Math.ceil(count / 2);
        if (separator == 0) {
            separator = count;
        }

        for (let child of metadata.Children as Array<ObjectRegion>) {
            let control: any = {};
            switch (alObject.Type) {
                case 'page':
                    i++;

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

                        if (control.ControlType == 'part' && container == 'Controls') {
                            let item = {
                                Name: control.SourceExpression, 
                                Type: 'Page'
                            } as ALObjectDesigner.CollectorItem;
                            control.Symbol = await this.parseSymbol(item);
                        }
                    } else {
                        control.Name = utils.toUpperCaseFirst(child.Name as string);
                    }
                    break;

                    let kind: any = ALSymbolPackage.ControlKind;
                    if (container == 'Actions') {
                        kind = ALSymbolPackage.ActionKind;
                    }

                    control.Kind = kind[utils.toUpperCaseFirst(control.ControlType)];
                case 'table':
                    control.ControlType = child.Region;
                    control.SourceCodeAnchor = child.Source || '';
                    control.SourceExpression = '';

                    if (['field', 'key'].indexOf(control.ControlType) != -1) {
                        let fieldData = (child.Name as string).split(';');

                        switch (control.ControlType) {
                            case 'field':
                                control.Id = fieldData[0].trim();
                                control.Name = fieldData[1].trim();
                                break;
                            case 'key':
                                control.Name = fieldData[0].trim();
                                control.FieldNames = fieldData[1].trim().split(',').map(m => m.trim());
                                break;
                        }

                    } else {
                        control.Name = utils.toUpperCaseFirst(child.Name as string);
                    }
                    break;
            }

            control.Properties = child.Properties as Array<ObjectProperty>;
            let caption = control.Properties ? control.Properties.filter((f: any) => f.Name == 'Caption') : [];
            if (caption.length > 0) {
                control.Caption = caption[0].Value.replace(/'/g, '').trim();
            } else {
                control.Caption = control.Name.replace(/"/g, '').trim();
            }
            control[container] = await this.processSymbol(alObject, container, child, control);
            result.push(control);
        }

        return result;
    }
}