import { ALPanel } from "../ALPanel";
import { ContextMenuCommandBase } from './Base/ContextMenuCommandBase';

export class NewQueryCommand extends ContextMenuCommandBase {

    public constructor(lObjectDesigner: ALPanel, lExtensionPath: string) {
        super(lObjectDesigner, lExtensionPath);
    }

    getOptions(message: any) {
        let newOptions = {
            Type: "query",
            SubType: "",
            Group: `dataitem(MainItem;"${message.Name}")`,
            Area: "elements",
            Field: "column"
        };

        return newOptions;   
    }
}