import { ALPanel } from "../ALPanel";
import { SourceCommandBase } from './Base/SourceCommandBase';

export class SelectSourceCommand extends SourceCommandBase {

    public constructor(lObjectDesigner: ALPanel, lExtensionPath: string) {
        super(lObjectDesigner, lExtensionPath);
    }
}