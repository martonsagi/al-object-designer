import * as vscode from 'vscode';
import * as path from 'path';
import * as utils from './utils';
import { ALObjectParser } from './ALObjectParser';
import { ALPanel } from './ALPanel';
import { ALObjectDesigner, ALSymbolPackage } from './ALModules';

const clipboardy = require('clipboardy');

export class ALCommandHandler implements ALObjectDesigner.CommandHandler {
    message: any;

    protected objectDesigner: ALPanel;
    protected extensionPath: string = '';

    public constructor(lObjectDesigner: ALPanel, lExtensionPath: string) {
        this.objectDesigner = lObjectDesigner;
        this.extensionPath = lExtensionPath;
    }

    public async dispatch(message: any) {
        let showOpen = true;
        switch (message.Command) {
            default:
                showOpen = false;
                await this.commandContextMenuHandler(message);
                break;
            case 'Run':
                await this.commandRun(message);
                break;
            case 'NewEmpty':
                showOpen = false;
                await this.commandNewEmpty(message);
                break;
            case 'NewEmptyCustom':
                showOpen = false;
                await this.commandNewEmptyCustom(message);
                break;
            case 'Definition':
                await this.commandDefinition(message);
                break;
            case 'Design':
                await this.commandDesign(message);
                break;
            case 'CopyEvent':
                showOpen = false;
                await this.commandCopyEvent(message);
                break;
        }

        if (showOpen)
            await vscode.window.showInformationMessage(`${message.Type} ${message.Id} ${message.Name} opened.`);
    }

    //#region Commands
    private async commandNewEmpty(message: any) {
        if (message.Command == 'NewEmpty') {
            let newDoc = await vscode.workspace.openTextDocument({ language: 'al', content: '' });
            let editor = await vscode.window.showTextDocument(newDoc);

            if (message.Type != 'empty') {
                let snippet: any = await utils.read(path.join(this.extensionPath, 'altemplates', `${message.Type}.json`));
                snippet = JSON.parse(snippet);
                editor.insertSnippet(new vscode.SnippetString(snippet.body.join("\r\n")));
            }
            return;
        }
    }

    private async commandNewEmptyCustom(message: any) {
        let newDoc = await vscode.workspace.openTextDocument({ language: 'al', content: '' });
        let editor = await vscode.window.showTextDocument(newDoc);

        let snippet: any = await utils.read(message.FsPath);
        snippet = JSON.parse(snippet);
        editor.insertSnippet(new vscode.SnippetString(snippet.body.join("\r\n")));

        return;
    }

    private async commandRun(message: any) {
        return await this.commandDefinition(message);
    }

    private async commandDefinition(message: any) {
        let objType = message.Type,
            notDefinition = message.Command != 'Definition';
        switch (objType) {
            case 'Table':
                objType = 'Record';
                break;
        }

        let createFile: boolean = message.FsPath == "" || message.Command == 'Run';
        let fname = "";

        if (createFile) {
            fname = (vscode.workspace as any).workspaceFolders[0].uri.fsPath + path.sep + `.vscode` + path.sep + `Opening_${Date.now()}.al`;
            let snippet =
                `${notDefinition ? message.Type.toLowerCase() : "codeunit"} ${notDefinition ? message.Id : "99999999"} ${notDefinition ? '"' + message.Name + '"' : "Temp"} {
    var
        Lookup: ${objType} "${message.Name}";
}`
                ;
            await utils.write(fname, snippet);
            let newDoc = await vscode.workspace.openTextDocument(fname);
            let editor = await vscode.window.showTextDocument(newDoc);

            let pos = new vscode.Position(2, 18 + objType.length);
            editor.selection = new vscode.Selection(pos, pos);
        }

        if (message.Command == 'Run') {
            let res: any = await vscode.commands.executeCommand('crs.RunCurrentObjectWeb');
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        } else {
            if (message.FsPath != "") {
                let newDoc = await vscode.workspace.openTextDocument(message.FsPath);
                await vscode.window.showTextDocument(newDoc, vscode.ViewColumn.One);
            } else {
                let res: any = await vscode.commands.executeCommand('editor.action.goToDeclaration');
            }
        }

        if (createFile) {
            setTimeout(() => {
                try {
                    utils.unlink(fname);
                } catch (e) {
                    console.log(e);
                }
            }, 1000);
        }
    }

    private async commandDesign(message: any) {
        if (message.Command == 'Design') {
            let parsedObj = new ALObjectParser(message);
            if (message.FsPath == '') {
                message.Symbol = await parsedObj.parse(message, ALObjectDesigner.ParseMode.Symbol);
            } else {
                await parsedObj.create();
                message.ParsedObject = parsedObj.fields;
                message.Symbol = await parsedObj.parse(message.FsPath, ALObjectDesigner.ParseMode.File);
            }
            message.SubType = parsedObj.subType;
            await ALPanel.createOrShow(this.extensionPath, ALObjectDesigner.PanelMode.Design, message);
            return;
        }
    }

    private async commandCopyEvent(message: any) {
        let objEvent = message.EventData;
        let eventParams = [];

        if (objEvent.EventParameters) {
            for (let i = 0; i < objEvent.EventParameters.length; i++) {
                const eventParam = objEvent.EventParameters[i];
                let paramType = eventParam.TypeDefinition;
                let paramTypeStr = `${paramType.Name}`;
                if (paramType.Subtype) {
                    if (!paramType.IsEmpty) {
                        let objectList = this.objectDesigner.objectList as Array<ALObjectDesigner.CollectorItem>;
                        let object = objectList.filter(f => {
                            let lType = paramType.Name == 'Record' ? 'Table' : paramType.Name;
                            return f.Type == lType && f.Id == paramType.Subtype.Id;
                        });

                        if (object.length > 0) {
                            paramType.Subtype.Id = `"${object[0].Name}"`;
                        }

                        paramTypeStr = `${paramType.Name} ${paramType.Subtype.Id}`
                    }
                }

                eventParams.push(`${eventParam.IsVar ? 'var ' : ''}${eventParam.Name}: ${paramTypeStr}`);
            }
        }

        let eventSnippet = `
    [EventSubscriber(ObjectType::${objEvent.Type}, ${objEvent.Type == 'Table' ? 'Database' : objEvent.Type}::"${objEvent.Name}", '${objEvent.EventName}', '', true, true)]
    local procedure "${objEvent.Name}_${objEvent.EventName}"
    (
        ${eventParams.join(';\r\n\t\t')}
    )
    begin

    end;
`
        await clipboardy.write(eventSnippet);

        await vscode.window.showInformationMessage(`${objEvent.Type} ${objEvent.Id} ${objEvent.Name} - ${objEvent.EventName} copied to clipboard.`);
    }

    private async commandContextMenuHandler(message: any) {
        if (['Parse', 'NewList', 'NewCard', 'NewReport', 'NewXmlPort', 'NewQuery'].indexOf(message.Command) != -1) {
            let newOptions: any = {};
            switch (message.Command) {
                case 'NewList':
                    newOptions = {
                        Type: "page",
                        SubType: "List",
                        Group: "repeater(Group)",
                        Area: "area(content)",
                        Field: "field"
                    };
                    break;
                case 'NewCard':
                    newOptions = {
                        Type: "page",
                        SubType: "Card",
                        Group: "group(General)",
                        Area: "area(content)",
                        Field: "field"
                    };
                    break;
                case 'NewReport':
                    newOptions = {
                        Type: "report",
                        SubType: "",
                        Group: `dataitem(MainItem;"${message.Name}")`,
                        Area: "dataset",
                        Field: "column"
                    };
                    break;
                case 'NewXmlPort':
                    newOptions = {
                        Type: "xmlport",
                        SubType: "",
                        Group: `dataitem(MainItem;"${message.Name}")`,
                        Area: "dataset",
                        Field: "column"
                    };
                    break;
                case 'NewQuery':
                    newOptions = {
                        Type: "query",
                        SubType: "",
                        Group: `dataitem(MainItem;"${message.Name}")`,
                        Area: "elements",
                        Field: "column"
                    };
                    break;
            }

            let parser = new ALObjectParser();
            let parsedObject = await parser.parse(message.FsPath, ALObjectDesigner.ParseMode.File) as ALSymbolPackage.Table;

            let fields = parsedObject.Fields;
            let caption = `${parsedObject.Name}${newOptions.SubType != "" ? ` ${newOptions.SubType}` : ''}`;
            let content = `
${newOptions.Type} ${'${1:id}'} "${'${2:' + caption + '}'}"
{
    Caption = '${'${2:' + caption + '}'}';`;

            if (newOptions.Type == "page") {
                content += `
    PageType = ${newOptions.SubType};
    SourceTable = "${parsedObject.Name}";
    UsageCategory = ${newOptions.SubType == "Card" ? 'Documents' : 'Lists'};
    
    layout
    {
    `;
            }

            content +=
                `       
        ${newOptions.Area}
        {
            ${newOptions.Group}
            {
                `;

            for (let field of fields) {

                content += `
                ${newOptions.Field}("${newOptions.Type == "page" ? field.Name : field.Name.replace(/\s|\./g, '_')}"; "${field.Name}") 
                {
                        ${newOptions.Type == "Page" ? 'ApplicationArea = All;' : ''}
                }
                `;
            }

            content += `
            }
        }`;

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

    //#endregion

}