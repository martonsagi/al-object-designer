import { ALPanel } from "../ALPanel";
import { RunCommandBase } from './Base/RunCommandBase';

export class RunCommand extends RunCommandBase {

    public constructor(lObjectDesigner: ALPanel, lExtensionPath: string) {
        super(lObjectDesigner, lExtensionPath);
    }
}