import * as vscode from 'vscode';
import { ALCommandBase } from "./ALCommandBase";
import { ALPanel } from "../../ALPanel";
import { ALObjectParser } from "../../ALObjectParser";
import { ALSymbolPackage, ALObjectDesigner } from "../../ALModules";
import * as utils from '../../utils';

export class ContextMenuCommandBase extends ALCommandBase {

    _vsSettings: any;
    
    public constructor(lObjectDesigner: ALPanel, lExtensionPath: string) {
        super(lObjectDesigner, lExtensionPath);
        this._vsSettings = utils.getVsConfig();
    }

    async execute(message: any) {
        if (['Parse', 'NewList', 'NewCard', 'NewReport', 'NewXmlPort', 'NewQuery', 'NewTableExt', 'NewPageExt'].indexOf(message.Command) != -1) {
            let newOptions: any = this.getOptions(message);
            let extensionObject: boolean = ["pageextension", 'tableextension'].indexOf(newOptions.Type) != -1;

            let parser = new ALObjectParser(),
                parseMode = message.FsPath != '' ? ALObjectDesigner.ParseMode.File : ALObjectDesigner.ParseMode.Symbol,
                parsedObject = await parser.parse(message, parseMode) as ALSymbolPackage.Table;

            let fields = parsedObject.Fields,
                caption = `${parsedObject.Name}${newOptions.SubType != "" ? ` ${newOptions.SubType}` : ''}`,
                content = 
`${newOptions.Type} ${'${1:id}'} "${'${2:' + caption + (extensionObject === true ? '_Ext' : '') + '}'}"${extensionObject === true ? ' extends "'+message.Name+'"' : '' }
{
    Caption = '${'${2:' + caption + '}'}';`;

            if (newOptions.Type == "page") {
                content += `
    PageType = ${newOptions.SubType};
    SourceTable = "${parsedObject.Name}";
    UsageCategory = ${newOptions.SubType == "Card" ? 'Documents' : 'Lists'};
    ApplicationArea = All;
    
    layout
    {
    `;
            }

            if (extensionObject !== true) {

            content +=
                `       
        ${newOptions.Area}
        {
            ${newOptions.Group}
            {
                `;

            for (let field of fields) {

                let caption = (<any>field).Caption ? (field as any).Caption : field.Name;
                //${newOptions.Field}("${newOptions.Type == "page" ? field.Name : field.Name.replace(/\s|\./g, '_')}"; "${field.Name}") 
                content += `
                ${newOptions.Field}("${newOptions.Type == "page" ? field.Name : field.Name.replace(/\s|[-.()%#/+&?;*!]/g, '_')}"; "${field.Name}") 
                {
                    ${newOptions.Type == "page" ? 'ApplicationArea = All;' : ''}
                    ${newOptions.Type == "page" ? `//Caption = '${caption}';` : ''}
                    ${newOptions.Type == "page" ? `Tooltip = 'Specifies the ${caption}.';` : ''}
                }
                `;
            }

            content += `
            }
        }`;

            }

            if (newOptions.Type == "page") {
                content += `
    }
    `;
            }
            content += `
}`;

            let newDoc = await vscode.workspace.openTextDocument({ language: "al", content: '' });
            let editor = await vscode.window.showTextDocument(newDoc);
            editor.insertSnippet(new vscode.SnippetString(content));

            return true;
        } else {
            return false;
        }
    }

    getOptions(message: any) {
        let newOptions: any = {};
        return newOptions;   
    }
}