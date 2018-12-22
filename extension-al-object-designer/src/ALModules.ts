export module ALSymbolPackage {

    export interface SymbolReference {
        AppId: string;
        Name: string;
        Publisher: string;
        Version: string;
        Tables: Array<Table>;
        Codeunits: Array<Codeunit>;
        Pages: Array<Page>;
        PageExtensions: Array<PageExtension>;
        PageCustomizations: Array<PageCustomization>;
        TableExtensions: Array<TableExtension>;
        Reports: Array<Report>;
        XmlPorts: Array<XmlPort>;
        Queries: Array<Query>;
        Profiles: Array<Profile>;
        ControlAddIns: Array<any>;
        EnumTypes: Array<EnumType>;
        DotNetPackages: Array<any>;
    }

    export interface ALObject {
        Id: number;
        Name: string;
        Properties?: Array<Property>;
        Variables?: Array<Variable>;
        Methods?: Array<Method>;
    }

    export interface Table extends ALObject {
        Fields: Array<TableField>;
        Keys: Array<TableKey>;
        FieldGroups: Array<TableKey>;
    }

    export interface TableExtension extends Table {
        TargetObject: string;
    }

    export interface Page extends ALObject {
        Controls: Array<PageControl>;
        Actions: Array<PageAction>;
    }

    export interface PageExtension extends ALObject {
        TargetObject: string;
        ControlChanges: Array<any>;        
    }

    export interface PageCustomization extends PageExtension {
    }

    export interface Codeunit extends ALObject {
    }

    export interface Report extends ALObject {
        RequestPage?: Page;
        DataItems: Array<any>;
    }

    export interface XmlPort extends ALObject {
        RequestPage?: Page;
        Schema: Array<any>;
    }

    export interface Query extends ALObject {
        Elements: Array<any>;
    }

    export interface EnumType extends ALObject {
        Values: Array<EnumValue>;
    }

    export interface Profile extends ALObject {
        Description: string;
        RoleCenter: string;
        Customizations: Array<string>;
    }

    // AL Properties
    export interface Property {
        Name: string;
        Value: string;
    }

    export interface TypeDefinition {
        Name: string;
        Subtype?: TypeDefinitionSubType
    }

    export interface TypeDefinitionSubType {
        Id: number;
        Name: string;
        IsEmpty: boolean;
    }

    export interface TableField {
        Id: number;
        Name: string;
        Properties: Array<Property>;
    }

    export interface TableKey {
        Name: string;
        FieldNames: Array<string>;
        Properties?: Array<Property>;
    }

    export interface Variable {
        Name: string;
        TypeDefinition: TypeDefinition;        
    }

    export interface Parameter extends Variable {
        IsVar: boolean;
    }

    export interface Attribute {
        Name: string;
        Arguments?: Array<Argument>;
    }

    export interface Argument {
        Value?: string;
    }

    export interface ReturnTypeDefinition {
        Name: string;
    }

    export interface Method {
        Id: number;
        Name: string;
        ReturnTypeDefinition: ReturnTypeDefinition;
        MethodKind: number;
        Variables: Array<Variable>;
        Parameters: Array<Parameter>;
        Attributes?: Array<any>;
        IsLocal?: boolean;
    }

    export interface EnumValue {
        Name: string;
        Ordinal: number;
        Properties?: Array<Property>;
    }

    export interface PageControl {
        Id: number;
        Name: string;
        Kind: number;
        Controls?: Array<PageControl>;
        TypeDefinition: TypeDefinition;
        Properties?: Array<Property>;
    }

    export interface PageAction {
        Id: number;
        Name: string;
        Kind: number;
        Actions?: Array<PageAction>;
        Properties?: Array<Property>;
    }   
}

export module ALObjectDesigner {

    export enum PanelMode {
        List = "List",
        Design = "Design"
    }

    export interface CollectorItem {
        TypeId: number;
        Type: string;
        Id: number;
        Name: string;
        TargetObject?: string;
        Publisher: string;
        Version: string;
        CanExecute: boolean;
        CanDesign: boolean;
        CanCreatePage: boolean;
        FsPath: string;
        EventName: string;
        EventType?: string;
        Events?: Array<any>;
        EventParameters?: Array<ALSymbolPackage.Parameter>;
    }

    export interface TemplateItem {
        id: string;
        title: string;
        description: string;
        body: Array<string>;
        position: number;
        path: string;
    }

    export interface Collector<T> {
        discover(): Promise<Array<T>>;
    }

    export interface ObjectCollector extends Collector<CollectorItem> {
        discover(): Promise<Array<CollectorItem>>;
    }

    export interface TemplateCollector extends Collector<TemplateItem> {
        initialize(): void;
        discover(): Promise<Array<TemplateItem>>;
    }

    export interface TemplateCollector {

    }

    export interface CommandHandler {

    }
}
