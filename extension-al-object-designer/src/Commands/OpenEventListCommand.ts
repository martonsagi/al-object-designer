import { ALPanel } from "../ALPanel";
import { ALCommandBase } from "./Base/ALCommandBase";
import { ALObjectParser } from '../ALObjectParser';
import { ALObjectDesigner } from '../ALModules';

export class OpenEventListCommand extends ALCommandBase {

    public constructor(lObjectDesigner: ALPanel, lExtensionPath: string) {
        super(lObjectDesigner, lExtensionPath);
        this.showInfo = true;
    }

    async execute(message: any) {
        let parser = new ALObjectParser();
        message = await parser.updateCollectorItem(message);

        await ALPanel.open(this.extensionPath, ALObjectDesigner.PanelMode.EventList, message);        
        return;
    }
}