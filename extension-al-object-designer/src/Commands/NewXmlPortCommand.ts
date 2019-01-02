import { ALPanel } from "../ALPanel";
import { ContextMenuCommandBase } from './Base/ContextMenuCommandBase';

export class NewXmlPortCommand extends ContextMenuCommandBase {

    public constructor(lObjectDesigner: ALPanel, lExtensionPath: string) {
        super(lObjectDesigner, lExtensionPath);
    }

    getOptions(message: any) {
        let newOptions = {
            Type: "xmlport",
            SubType: "",
            Group: `dataitem(MainItem;"${message.Name}")`,
            Area: "dataset",
            Field: "column"
        };

        return newOptions;   
    }
}