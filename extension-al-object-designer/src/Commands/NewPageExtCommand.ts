import { ALPanel } from "../ALPanel";
import { ContextMenuCommandBase } from './Base/ContextMenuCommandBase';

export class NewPageExtCommand extends ContextMenuCommandBase {

    public constructor(lObjectDesigner: ALPanel, lExtensionPath: string) {
        super(lObjectDesigner, lExtensionPath);
    }

    getOptions(message: any) {
        let newOptions = {
            Type: "pageextension",
            SubType: "",
            Group: "",
            Area: "",
            Field: "",
            BaseObject: message.BaseObject
        };

        return newOptions;   
    }
}