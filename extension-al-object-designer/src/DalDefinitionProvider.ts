import { ALPanel } from './ALPanel';
import { DefinitionProvider, TextDocument, Position, CancellationToken, ProviderResult, Location, LocationLink, Uri } from "vscode";
import { RunCommand } from "./Commands/RunCommand";
import { replaceAll } from './utils';

export class DalDefinitionProvider implements DefinitionProvider {
    provideDefinition(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<Location | Location[] | LocationLink[]> {
        console.log('alObjectDesignerDalDef', document, position);

        let selectedLine = document.lineAt(position);
        let checkTxt = selectedLine.text;
        let message = null;

        // test for properties
        message = this._navigateProperty(checkTxt, position);

        // test for variable definition
        if (message === null) {
            message = this._navigateVariable(checkTxt, position);
        }

        if (message !== null) {
            let command = new RunCommand(ALPanel.currentPanel!, '');
            command.execute(message);
        }

        return [];
    }

    private _navigateVariable(checkTxt: string, position: Position) {
        let part = checkTxt;
        let startPos = 0,
            endPos = -1,
            length = part.length;

        for (let i = position.character; i >= 0; i--) {
            if ([',', ';'].indexOf(part[i]) != -1) {
                startPos = i;
                break;
            }
        }

        for (let i = position.character; i < length; i++) {
            if ([',', ';', ')'].indexOf(part[i]) != -1) {
                endPos = i;
                break;
            }
        }

        if (endPos === -1) {
            return null;
        }

        part = checkTxt.substring(startPos, endPos);
        let pattern = /\:.*?(codeunit|page|pageextension|pagecustomization|dotnet|enum|interface|enumextension|query|report|record|tableextension|xmlport|profile|controladdin)\s?(.*)/gmi;
        let found = pattern.exec(part);
        if (found && found.length > 2) {
            let type = found[1].replace(/record/gi, 'Table');
            let name = replaceAll(found[2], '"', '');

            let message = {
                Command: 'Definition',
                Type: type,
                Name: name
            };

            return message;
        }

        return null;
    }

    private _navigateProperty(checkTxt: string, position: Position) {
        let pattern = /(.*?)\s+\=\s+(.*?)\;$/gmi;
        let found = pattern.exec(checkTxt);
        if (found && found.length > 2) {
            let propName = found[1].trim().toLowerCase();
            let propMap = this._getSupportedPropertyMap();
            if (!propMap[propName]) {
                return null;
            }

            let type = propMap[propName];
            let name = replaceAll(found[2], '"', '').trim();
            if (propName == 'tablerelation') {
                let parts = found[2].split('".');
                name = replaceAll(parts[0], '"', '').trim();
            }

            let message = {
                Command: 'Definition',
                Type: type,
                Name: name
            };

            return message;
        }

        return null;
    }

    private _getSupportedPropertyMap() {
        return {
            sourcetable: 'Table',
            tablerelation: 'Table',
            cardpageid: 'Page',
            lookuppageid: 'Page',
            drilldownpageid: 'Page'
        };
    }

}