import { ALPanel } from "../ALPanel";
import { ContextMenuCommandBase } from './Base/ContextMenuCommandBase';

export class NewCardCommand extends ContextMenuCommandBase {

    public constructor(lObjectDesigner: ALPanel, lExtensionPath: string) {
        super(lObjectDesigner, lExtensionPath);
    }

    getOptions(message: any) {
        let newOptions = {
            Type: "page",
            SubType: "Card",
            Group: "group(General)",
            Area: "area(content)",
            Field: "field"
        };

        return newOptions;   
    }
}