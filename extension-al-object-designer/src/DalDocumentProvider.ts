import { ALObjectCollector } from './ALObjectCollector';
import { TextDocumentContentProvider, EventEmitter, Uri } from 'vscode';

export class DalDocumentProvider implements TextDocumentContentProvider {

    // emitter and its event
    onDidChangeEmitter = new EventEmitter<Uri>();
    onDidChange = this.onDidChangeEmitter.event;

    async provideTextDocumentContent(uri: Uri): Promise<string> {
        let symbolData = JSON.parse(uri.fragment);
        let result: string = uri.fragment;
        
        let collector = new ALObjectCollector();
        result = await collector.extractSymbolSource(symbolData);
        
        return result;
    }
}