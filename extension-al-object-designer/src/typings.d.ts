declare module "*!text" {
    const value: string;
    export default value;
}

declare namespace ALObjectDesigner {

    class ALSymbolPackage {
        AppId: string;
        Name: string;
        Publisher: string;
        Version: string;
        Tables: Array<ALTable>;
        Codeunits: Array<ALCodeunit>;
        Pages: Array<ALPage>;
        PageExtensions: Array<ALPageExtension>;
        PageCustomizations: Array<ALPageCustomization>;
        TableExtensions: Array<ALTableExtension>;
        Reports: Array<ALReport>;
        XmlPorts: Array<ALXmlPort>;
        Queries: Array<ALQuery>;
        Profiles: Array<ALProfile>;
        ControlAddIns: Array<any>;
        EnumTypes: Array<ALEnumType>;
        DotNetPackages: Array<any>;
    }


    class ALObject {
        Id: number;
        Name: string;
        Properties?: Array<ALProperty>;
        Variables?: Array<ALVariable>;
        Methods?: Array<ALMethod>;
    }

    class ALTable extends ALObject {
        Fields: Array<ALTableField>;
        Keys: Array<ALTableKey>;
    }

    class ALTableExtension extends ALTable {
        TargetObject: string;
    }

    class ALPage extends ALObject {
        Controls: Array<ALPageControl>;
        Actions: Array<ALPageAction>;
    }

    class ALPageExtension extends ALObject {
        TargetObject: string;
        ControlChanges: Array<any>;        
    }

    class ALPageCustomization extends ALPageExtension {
    }

    class ALCodeunit extends ALObject {
    }

    class ALReport extends ALObject {
        RequestPage?: ALPage;
        DataItems: Array<any>;
    }

    class ALXmlPort extends ALObject {
        RequestPage?: ALPage;
        Schema: Array<any>;
    }

    class ALQuery extends ALObject {
        Elements: Array<any>;
    }

    class ALEnumType extends ALObject {
        Values: Array<ALEnumValue>;
    }

    class ALProfile extends ALObject {
        Description: string;
        RoleCenter: string;
        Customizations: Array<string>;
    }

    // AL Properties
    class ALProperty {
        Name: string;
        Value: string;
    }

    class ALTypeDefinition {
        Name: string;
        Subtype?: ALTypeDefinitionSubType
    }

    class ALTypeDefinitionSubType {
        Id: number;
        Name: string;
        IsEmpty: boolean;
    }

    class ALTableField {
        Id: number;
        Name: string;
        Properties: Array<ALProperty>;
    }

    class ALTableKey {
        Name: string;
        FieldNames: Array<string>;
        Properties?: Array<ALProperty>;
    }

    class ALVariable {
        Name: string;
        TypeDefinition: ALTypeDefinition;        
    }

    class ALParameter extends ALVariable {
        IsVar: boolean;
    }

    class ALAttribute {
        Name: string;
        Arguments?: Array<ALArgument>;
    }

    class ALArgument {
        Value?: string;
    }

    class ALReturnTypeDefinition {
        Name: string;
    }

    class ALMethod {
        Id: number;
        Name: string;
        ReturnTypeDefinition: ALReturnTypeDefinition;
        MethodKind: number;
        Variables: Array<ALVariable>;
        Parameters: Array<ALParameter>;
        Attributes?: Array<any>;
        IsLocal?: boolean;
    }

    class ALEnumValue {
        Name: string;
        Ordinal: number;
        Properties?: Array<ALProperty>;
    }

    class ALPageControl {
        Id: number;
        Name: string;
        Kind: number;
        Controls?: Array<ALPageControl>;
        TypeDefinition: ALTypeDefinition;
        Properties?: Array<ALProperty>;
    }

    class ALPageAction {
        Id: number;
        Name: string;
        Kind: number;
        Actions?: Array<ALPageAction>;
        Properties?: Array<ALProperty>;
    }
}