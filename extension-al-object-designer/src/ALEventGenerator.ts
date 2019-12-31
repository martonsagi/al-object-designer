import { ALObjectParser } from "./ALObjectParser";
import { ALObjectDesigner } from "./ALModules";

export class ALEventGenerator {

    getEventTemplate(symbol: any, info: any) {
        return {
            'TypeId': info.TypeId,
            'Type': 'Table',
            'Id': symbol.Id,
            'Name': symbol.Name,
            "TargetObject": symbol.TargetObject || "",
            "Publisher": info.Publisher || "Platform",
            "Application": info.Application || "",
            "Version": info.Version || "",
            "CanExecute": false,
            "CanDesign": false,
            "FsPath": info.FsPath,
            'EventName': 'OnInsert',
            'EventType': 'TriggerEvent',
            'EventPublisher': true,
            'EventParameters': [],
            'FieldName': '',
            "SymbolData": null,
            "SourceTable": '',
            "SourceTableId": 0
        };
    }

    generateTableEvents(symbol: any, info: any, includeFields: boolean) {
        let eventTemplate = this.getEventTemplate(symbol, info);

        let result: Array<any> = [];

        // creating global trigger events
        result.push(this.getTableEvent(eventTemplate, 'OnBeforeInsertEvent', false, true, ''));
        result.push(this.getTableEvent(eventTemplate, 'OnAfterInsertEvent', false, true, ''));
        result.push(this.getTableEvent(eventTemplate, 'OnBeforeModifyEvent', true, true, ''));
        result.push(this.getTableEvent(eventTemplate, 'OnAfterModifyEvent', true, true, ''));
        result.push(this.getTableEvent(eventTemplate, 'OnBeforeDeleteEvent', false, true, ''));
        result.push(this.getTableEvent(eventTemplate, 'OnAfterDeleteEvent', false, true, ''));
        result.push(this.getTableEvent(eventTemplate, 'OnBeforeRenameEvent', true, true, ''));
        result.push(this.getTableEvent(eventTemplate, 'OnAfterRenameEvent', true, true, ''));

        if (includeFields === true) {
            // field level events
            for (let field of symbol.Fields) {
                result.push(this.getTableEvent(eventTemplate, 'OnBeforeValidateEvent', true, false, field.Name));
                result.push(this.getTableEvent(eventTemplate, 'OnAfterValidateEvent', true, false, field.Name));
            }
        }
        return result;
    }

    getTableEvent(inEvent: any, eventName: string, xRec: boolean, runTrigger: boolean, fieldName: string) {
        let event = Object.assign({}, inEvent);
        event.EventName = eventName;
        event.EventType = 'TriggerEvent';

        let parameters: Array<any> = [
            {
                "IsVar": true,
                "Name": "Rec",
                "TypeDefinition": {
                    "Name": "Record",
                    "Subtype": {
                        "Name": event.Name,
                        "Id": event.Id,
                        "IsEmpty": false
                    }
                }
            }];

        if (xRec === true) {
            parameters.push(
                {
                    "IsVar": true,
                    "Name": "xRec",
                    "TypeDefinition": {
                        "Name": "Record",
                        "Subtype": {
                            "Name": event.Name,
                            "Id": event.Id,
                            "IsEmpty": false
                        }
                    }
                });
        }

        if (runTrigger === true) {
            parameters.push(
                {
                    "IsVar": false,
                    "Name": "RunTrigger",
                    "TypeDefinition": {
                        "Name": "Boolean",
                    }
                }
            );
        }

        if (fieldName && fieldName.length > 0) {
            parameters.push(
                {
                    "IsVar": false,
                    "Name": "CurrFieldNo",
                    "TypeDefinition": {
                        "Name": "Integer",
                    }
                }
            );

            event.FieldName = fieldName;
            event.EventType = 'TriggerEvent';
        }

        event.EventParameters = parameters;

        return event;
    }

    async generatePageEvents(symbol: any, info: any, includeFields: boolean) {
        let eventTemplate = this.getEventTemplate(symbol, info);
        eventTemplate.Type = 'Page';
        eventTemplate.SourceTable = ALObjectParser.getSymbolProperty(symbol, 'SourceTable') as string;

        let parser = new ALObjectParser();
        let sourceTableInfo = {
            Name: eventTemplate.SourceTable,
            Type: 'Table'
        } as ALObjectDesigner.CollectorItem;
        let sourceTableSymbol = eventTemplate.SourceTable ? await parser.parseSymbol(sourceTableInfo) : null;

        if (!sourceTableSymbol) {
            eventTemplate.SourceTableId = 0;
        } else {
            eventTemplate.SourceTableId = sourceTableSymbol.Id;
        }

        let result: Array<any> = [];

        // creating global trigger events
        result.push(this.getPageEvent(eventTemplate, 'OnOpenPageEvent', false, false, false, ''));
        result.push(this.getPageEvent(eventTemplate, 'OnQueryClosePageEvent', false, 'AllowClose', false, ''));
        result.push(this.getPageEvent(eventTemplate, 'OnClosePageEvent', false, false, false, ''));
        result.push(this.getPageEvent(eventTemplate, 'OnNewRecordEvent', false, false, true, ''));
        result.push(this.getPageEvent(eventTemplate, 'OnInsertRecordEvent', true, 'AllowInsert', true, ''));
        result.push(this.getPageEvent(eventTemplate, 'OnModifyRecordEvent', true, 'AllowModify', false, ''));
        result.push(this.getPageEvent(eventTemplate, 'OnDeleteRecordEvent', false, 'AllowDelete', false, ''));
        result.push(this.getPageEvent(eventTemplate, 'OnAfterGetCurrRecordEvent', false, false, false, ''));
        result.push(this.getPageEvent(eventTemplate, 'OnAfterGetRecordEvent', false, false, false, ''));

        if (includeFields === true) {
            let fields = this.getPageParts('Controls', symbol, true);
            for (let field of fields) {
                result.push(this.getPageEvent(eventTemplate, 'OnBeforeValidateEvent', false, false, false, field));
                result.push(this.getPageEvent(eventTemplate, 'OnAfterValidateEvent', false, false, false, field));
            }

            let actions = this.getPageParts('Actions', symbol, true);
            for (let action of actions) {
                result.push(this.getPageEvent(eventTemplate, 'OnBeforeActionEvent', false, false, false, action));
                result.push(this.getPageEvent(eventTemplate, 'OnAfterActionEvent', false, false, false, action));
            }
        }
        return result;
    }

    getPageEvent(inEvent: any, eventName: string, xRec: boolean, allowBool: any, belowxRec: boolean, fieldOpts: any) {
        let event = Object.assign({}, inEvent);
        event.EventName = eventName;
        event.EventType = 'TriggerEvent';

        let parameters: Array<any> = [
            {
                "IsVar": true,
                "Name": "Rec",
                "TypeDefinition": {
                    "Name": "Record",
                    "Subtype": {
                        "Name": event.SourceTable,
                        "Id": event.SourceTableId,
                        "IsEmpty": false
                    }
                }
            }];

        if (xRec === true) {
            parameters.push(
                {
                    "IsVar": true,
                    "Name": "xRec",
                    "TypeDefinition": {
                        "Name": "Record",
                        "Subtype": {
                            "Name": event.SourceTable,
                            "Id": event.SourceTableId,
                            "IsEmpty": false
                        }
                    }
                });
        }

        if (event.SourceTableId === 0) {
            parameters = [];
        }

        if (allowBool !== false) {
            parameters.push(
                {
                    "IsVar": true,
                    "Name": allowBool,
                    "TypeDefinition": {
                        "Name": "Boolean",
                    }
                }
            );
        }

        if (belowxRec !== false) {
            parameters.push(
                {
                    "IsVar": false,
                    "Name": "BelowxRec",
                    "TypeDefinition": {
                        "Name": "Boolean",
                    }
                }
            );
        }

        if (fieldOpts != '') {
            event.FieldName = `\[${fieldOpts.Path}\] - ${fieldOpts.Name}`;
            event.FieldOptions = fieldOpts;
            event.EventType = fieldOpts.IsAction === true ? 'PageActionEvent' : 'PageFieldEvent';
        }

        event.EventParameters = parameters;

        return event;
    }

    getPageParts(type: string, symbol: any, firstLevel: boolean): Array<any> {
        let parts = symbol[type];

        if (!parts)
            return [];

        let result: Array<any> = [];

        for (let part of parts) {
            if (firstLevel === false)
                part.ParentPath = {
                    Name: symbol.Name,
                    ParentPath: symbol.ParentPath
                };

            let partName = part.Name && part.Name.length > 0 ? part.Name : '';
            if ((type == 'Actions' && part.Kind == 2) || (type == 'Controls' && part.Kind == 8)) {
                let partPath = this.getParentPath(part);
                let parents = partPath.reverse();
                result.push({ Name: partName, Path: parents.join(' / '), IsAction: type === 'Actions' });
            }
            let added = this.getPageParts(type, part, false);
            if (added.length > 0)
                result = result.concat(added);
        }

        return result;
    }

    getParentPath(symbol: any) {
        let result: Array<any> = [];

        if (symbol.ParentPath) {
            result.push(symbol.ParentPath.Name);
        }

        if (symbol.ParentPath) {
            let added = this.getParentPath(symbol.ParentPath);
            if (added.length > 0)
                result = result.concat(added);
        }

        return result;
    }
}