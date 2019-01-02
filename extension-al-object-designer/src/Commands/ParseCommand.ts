import { ALPanel } from "../ALPanel";
import { ContextMenuCommandBase } from './Base/ContextMenuCommandBase';

export class ParseCommand extends ContextMenuCommandBase {

    public constructor(lObjectDesigner: ALPanel, lExtensionPath: string) {
        super(lObjectDesigner, lExtensionPath);
    }

    getOptions(message: any) {
        let newOptions = {
            Type: "page",
            SubType: "List",
            Group: "repeater(Group)",
            Area: "area(content)",
            Field: "field"
        };

        return newOptions;   
    }
}