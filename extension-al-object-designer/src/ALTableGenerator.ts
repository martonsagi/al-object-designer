import * as vscode from 'vscode';
import * as utils from './utils';
import * as path from 'path';
const fs = require('fs-extra');

export class ALTableGenerator {

    fileContents: Array<string> = [];
    parsedTables: Array<ParsedTable> = [];

    constructor() {

    }

    async openFiles() {
        this.fileContents = [];
        let files = await vscode.window.showOpenDialog({ canSelectMany: true }) as Array<vscode.Uri>;

        for (let file of files) {
            let content = await utils.read(file.fsPath) as string;
            this.fileContents.push(content);
        }
    }

    parseContent(content: string) {
        let currObject: ParsedTable,
            lines = content.split(/\r?\n/),
            firstLine = lines[0],
            header = firstLine.split(';'),
            name = header[2].split(':')[0] || header[1],
            caption = header[2].split(':')[1] || name;

        currObject = {
            Id: header[1],
            Name: name,
            Caption: caption,
            Fields: []
        };

        this.parsedTables.push(currObject);

        for (let i = 1; i < lines.length; i++) {
            let line = lines[i];
            if (line.trim().length === 0) {
                let newLines = lines.slice(i + 1).join('\r\n');
                if (newLines.length > 0) {
                    this.parseContent(newLines);
                    return;
                }
            } else {
                let info = line.split(';');
                name = info[0].split(':')[0] || info[0],
                    caption = info[0].split(':')[1] || name;

                let field: ParsedField = {
                    Name: name,
                    Caption: caption,
                    Type: info[1],
                    Length: info[2] || null,
                    Description: info[3] || null
                };

                currObject.Fields.push(field);
            }
        }
    }

    async generate() {
        await this.openFiles();

        for (let content of this.fileContents) {
            this.parseContent(content);
        }
        
        for (let table of this.parsedTables) {
            let fieldNo = 0;
            let content =
`table ${table.Id} "${table.Name}" 
{
    DataClassification = CustomerContent;
    Caption = '${table.Caption}';

    fields
    {`;

            for (let field of table.Fields) {
                let isOption = field.Type.toLowerCase() === 'option';
                fieldNo++;
                content +=
`
        field(${fieldNo};"${field.Name}";${field.Length && !isOption ? `${field.Type}[${field.Length}]` : `${field.Type}`})
        {${isOption ? "\r\n\t\t\t"+`OptionMembers = "${(field.Length as string).split(',').join(`", "`)}";` : ''}
            DataClassification = CustomerContent;
            Caption = '${field.Caption}';${field.Description ? "\r\n\t\t\t"+`Description = '${field.Description}';` : ''}
        }
`;
            }

            content +=
    `}

    keys
    {
        key(PK; "${table.Fields[0].Name}")
        {
            Clustered = true;
        }
    }
}`
;
            let filename = `Tab${table.Id}.${table.Name}.al`;
            let filePath = path.join((vscode.workspace.workspaceFolders as Array<vscode.WorkspaceFolder>)[0].uri.fsPath, filename);
            await utils.write(filePath, content);

            let newDoc = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(newDoc, vscode.ViewColumn.Beside);
        }

        await vscode.window.showInformationMessage('New Table objects have been generated.');
    }
}

interface ParsedTable {
    Id: string;
    Name: string;
    Caption: string;
    Fields: Array<ParsedField>;
}

interface ParsedField {
    Name: string;
    Caption: string;
    Type: string;
    Length?: any;
    Description?: string | null;
}