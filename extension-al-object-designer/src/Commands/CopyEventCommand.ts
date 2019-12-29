import * as vscode from 'vscode';
import { ALPanel } from "../ALPanel";
import { ALCommandBase } from "./Base/ALCommandBase";
import { ALObjectDesigner } from '../ALModules';
const clipboardy = require('clipboardy');

export class CopyEventCommand extends ALCommandBase {

    public constructor(lObjectDesigner: ALPanel, lExtensionPath: string) {
        super(lObjectDesigner, lExtensionPath);
    }

    getEventSnippet(objEvent: any) {
        //let objEvent = message.EventData;
        let eventParams = [];

        if (objEvent.EventParameters) {
            for (let eventParam of objEvent.EventParameters) {
                let paramType = eventParam.TypeDefinition;
                let paramTypeStr = `${paramType.Name}`;
                if (paramType.Subtype) {
                    if (!paramType.IsEmpty) {
                        let objectList = this.objectDesigner.objectList as Array<ALObjectDesigner.CollectorItem>;
                        let object = objectList.find(f => {
                            let lType = paramType.Name == 'Record' ? 'Table' : paramType.Name;
                            return f.Type == lType && f.Id == paramType.Subtype.Id;
                        });

                        if (object) {
                            paramType.Subtype.Id = `"${object.Name}"`;
                        }

                        paramTypeStr = `${paramType.Name} ${paramType.Subtype.Id}`
                    }
                }

                eventParams.push(`${eventParam.IsVar ? 'var ' : ''}${eventParam.Name}: ${paramTypeStr}`);
            }
        }

        let eventSnippet = `
    [EventSubscriber(ObjectType::${objEvent.Type}, ${objEvent.Type == 'Table' ? 'Database' : objEvent.Type}::"${objEvent.Name}", '${objEvent.EventName}', '${objEvent.FieldName || ''}', true, true)]
    local procedure "${objEvent.Name}_${objEvent.EventName}${objEvent.EventType.toLowerCase() == "triggerevent" ? `_${objEvent.FieldName}` : ''}"`;

        if (eventParams.length > 1) {
            eventSnippet += `
    (
        ${eventParams.join(';\r\n\t\t')}
    )`;

        } else {
            eventSnippet += `(${eventParams.join(';\r\n\t\t')})`;
        }

        eventSnippet += `
    begin

    end;
`
        return eventSnippet;
    }

    async execute(message: any) {
        let objEvent = message.EventData;
        let eventSnippet = await this.getEventSnippet(objEvent);

        await clipboardy.write(eventSnippet);

        await vscode.window.showInformationMessage(`${objEvent.Type} ${objEvent.Id} ${objEvent.Name} - ${objEvent.EventName} copied to clipboard.`);
    }
}