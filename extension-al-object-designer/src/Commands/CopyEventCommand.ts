import * as vscode from 'vscode';
import { ALPanel } from "../ALPanel";
import { ALCommandBase } from "./Base/ALCommandBase";
import { ALObjectDesigner } from '../ALModules';
import * as utils from '../utils';
const clipboardy = require('clipboardy');

export class CopyEventCommand extends ALCommandBase {
    protected _vsSettings: any;

    public constructor(lObjectDesigner: ALPanel, lExtensionPath: string) {
        super(lObjectDesigner, lExtensionPath);
        this._vsSettings = utils.getVsConfig();
    }

    getEventSnippet(objEvent: any) {
        let eventList = this.objectDesigner.currEvents || ALPanel.eventList;
        let objectRow = eventList!.find(f => f.Type == objEvent.Type && f.Name == objEvent.Name && f.EventName == objEvent.EventName && f.EventType == objEvent.EventType) as ALObjectDesigner.CollectorItem;
        //let objEvent = message.EventData;
        let eventParams = [];

        if (this._vsSettings.pasteAllEventParameters === true) {
            if (objectRow.EventParameters) {
                for (let eventParam of objectRow.EventParameters) {
                    let paramType: any = eventParam.TypeDefinition;
                    let paramTypeStr = `${paramType.Name}`;
                    if (paramType.Subtype) {
                        if (!paramType.IsEmpty) {
                            let objectList = ALPanel.objectList as Array<ALObjectDesigner.CollectorItem>;
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
        }

        let objEventFieldName = objEvent.FieldOptions ? objEvent.FieldOptions.Name : objEvent.FieldName;
        let eventSnippet = `
    [EventSubscriber(ObjectType::${objEvent.Type}, ${objEvent.Type == 'Table' ? 'Database' : objEvent.Type}::"${objEvent.Name}", '${objEvent.EventName}', '${objEventFieldName || ''}', true, true)]
    local procedure "${objEvent.Name}_${objEvent.EventName}${["triggerevent", "pageactionevent", "pagefieldevent"].indexOf(objEvent.EventType.toLowerCase()) != -1 && objEvent.FieldName.length > 0 ? `_${objEvent.FieldName}` : ''}"`;

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