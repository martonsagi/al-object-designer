import * as vscode from 'vscode';
import { ALPanel } from "../../ALPanel";
import { ALCommandBase } from "./ALCommandBase";
const balanced = require('balanced-match');

export class SourceCommandBase extends ALCommandBase {

    public constructor(lObjectDesigner: ALPanel, lExtensionPath: string) {
        super(lObjectDesigner, lExtensionPath);
    }

    async execute(message: any) {
        let selectOnly = message.Command == 'SelectSource';
        let info = message.EventData.SourceCodeAnchorInfo;
        message.FsPath = info.fsPath || message.FsPath;

        let editor = vscode.window.visibleTextEditors.find(f => f.document.uri.fsPath == message.FsPath) as vscode.TextEditor;
        if (!editor) {
            let newDoc = await vscode.workspace.openTextDocument(message.FsPath);
            editor = await vscode.window.showTextDocument(newDoc, vscode.ViewColumn.One);
        }

        let text = editor.document.getText();

        let itemIndex = text.indexOf(info.anchor);
        let x = editor.document.positionAt(itemIndex);
        if (selectOnly === true) {
            editor.selection = new vscode.Selection(x, x);
            editor.revealRange(new vscode.Range(x, x), vscode.TextEditorRevealType.InCenter);
            return;
        }

        let endIndex = text.length - 1,
            region = text.substring(itemIndex, endIndex),
            balancedMatch = balanced('{', '}', region),
            prevIndex = text.indexOf(info.before),
            nextIndex = text.indexOf(info.after),
            startLine = editor.document.lineAt(x.line),
            y = editor.document.positionAt(itemIndex + balancedMatch.end + 1),
            endLine = editor.document.lineAt(y.line),
            range = new vscode.Range(startLine.range.start, endLine.range.end),
            newPos: vscode.Position,
            movedText: string = "",
            movingBottom: boolean = nextIndex == -1;

        if (movingBottom !== true) {
            newPos = editor.document.positionAt(nextIndex);
            newPos = new vscode.Position(newPos.line, 0);
        } else {
            let region = text.substring(prevIndex, endIndex);
            let balancedMatch = balanced('{', '}', region);

            newPos = editor.document.positionAt(prevIndex + balancedMatch.end + 1);
            movedText += '\n';
        }

        /*let linenum = range.start.line;
        let checkLine = editor.document.lineAt(linenum - 1);
        if (checkLine.isEmptyOrWhitespace) {
            startLine = checkLine;
        }*/

        let linenum = range.end.line,
            checkLine = editor.document.lineAt(linenum + 1);
        if (checkLine.isEmptyOrWhitespace && movingBottom !== true) {
            endLine = checkLine;
        }

        range = new vscode.Range(startLine.range.start, endLine.range.end);
        movedText += editor.document.getText(range);

        if (movingBottom !== true) {
            movedText += '\n';
        }

        linenum = range.start.line;
        checkLine = editor.document.lineAt(linenum - 1);
        if (checkLine.isEmptyOrWhitespace) {
            startLine = checkLine;
            range = new vscode.Range(startLine.range.start, endLine.range.end);
        }

        editor.edit(edit => {
            edit.insert(newPos, movedText);
            edit.delete(range);
        });

        await editor.document.save();
    }
}