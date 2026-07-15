export declare class CsvService {
    batchSize: any;
    bind: any;
    converterOptions: any;
    filename: any;
    find: any;
    flattened: any;
    folder: any;
    limit: any;
    offset: any;
    service: any;
    constructor({ bind, find, service, filename }: {
        bind: any;
        find: any;
        service: any;
        filename: any;
    });
    setConverterOptions(): void;
    makeFolder(): void;
    setFilename(filename: any): void;
    setFind(find: any): void;
    getEntries(limit: any, offset: any): Promise<any>;
    execute(): Promise<{
        duration: string;
        message: string;
        url: string;
        success: boolean;
        entries: number;
        requests: number;
    }>;
    exportToCSV(filePath: string): Promise<{
        success: boolean;
        entries: number;
        requests: number;
    }>;
    flatten(obj: any, parentKey?: string): void;
    flattenEntrie(entrie: any): any;
    flattenBatch(batch: any): any[];
    prepareCsv(json: any): string;
}
