import { ALPanel } from "../ALPanel";
import { RunCommandBase } from './Base/RunCommandBase';

export class DefinitionCommand extends RunCommandBase {

    public constructor(lObjectDesigner: ALPanel, lExtensionPath: string) {
        super(lObjectDesigner, lExtensionPath);
    }
}