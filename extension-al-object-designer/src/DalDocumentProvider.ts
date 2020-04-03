import { ALObjectCollector } from './ALObjectCollector';
import { TextDocumentContentProvider, EventEmitter, Uri } from 'vscode';
import { ALPanel } from './ALPanel';
import { ALObjectDesigner } from './ALModules';

export class DalDocumentProvider implements TextDocumentContentProvider {

    // emitter and its event
    onDidChangeEmitter = new EventEmitter<Uri>();
    onDidChange = this.onDidChangeEmitter.event;

    async provideTextDocumentContent(uri: Uri): Promise<string> {
        let message = JSON.parse(uri.fragment);
        let result: string = uri.fragment;

        let collector = new ALObjectCollector();
        let objectRow = ALPanel.objectList!.find(f => f.Type == message.Type && f.Name == message.Name) as ALObjectDesigner.CollectorItem;

        if (objectRow) {
            result = await collector.extractSymbolSource(objectRow.SymbolData!);
        }

        return result;
    }
}