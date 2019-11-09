export class ALEventGenerator {
    generateTableEvents(symbol: any, info: any, includeFields: boolean) {
        let eventTemplate = {
            'TypeId': info.TypeId,
            'Type': 'Table',
            'Id': symbol.Id,
            'Name': symbol.Name,
            "TargetObject": symbol.TargetObject || "",
            "Publisher": info.Publisher || "Platform",
            "Application": info.Name || "",
            "Version": info.Version || "",
            "CanExecute": false,
            "CanDesign": false,
            "FsPath": "",
            'EventName': 'OnInsert',
            'EventType': 'Trigger',
            'EventParameters': [],
            'FieldName': '',
            "SymbolData": null
        };

        let result: Array<any> = [];

        // creating global trigger events
        result.push(this.getTableEvent(eventTemplate, 'OnAfterDeleteEvent', false, true, ''));
        result.push(this.getTableEvent(eventTemplate, 'OnAfterInsertEvent', false, true, ''));
        result.push(this.getTableEvent(eventTemplate, 'OnAfterModifyEvent', true, true, ''));
        result.push(this.getTableEvent(eventTemplate, 'OnAfterRenameEvent', true, true, ''));
        result.push(this.getTableEvent(eventTemplate, 'OnBeforeDeleteEvent', false, true, ''));
        result.push(this.getTableEvent(eventTemplate, 'OnBeforeInsertEvent', false, true, ''));
        result.push(this.getTableEvent(eventTemplate, 'OnBeforeModifyEvent', true, true, ''));
        result.push(this.getTableEvent(eventTemplate, 'OnBeforeRenameEvent', true, true, ''));

        if (includeFields === true) {
            // field level events
            for (let field of symbol.Fields) {
                result.push(this.getTableEvent(eventTemplate, 'OnAfterValidateEvent', true, false, field.Name));
                result.push(this.getTableEvent(eventTemplate, 'OnBeforeValidateEvent', true, false, field.Name));
            }
        }
        return result;
    }

    getTableEvent(inEvent: any, eventName: string, xRec: boolean, runTrigger: boolean, fieldName: string) {
        let event = Object.assign({}, inEvent);
        event.EventName = eventName;
        event.EventType = 'Trigger';

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
            event.EventType = 'Field';
        }

        event.EventParameters = parameters;

        return event;
    }

}