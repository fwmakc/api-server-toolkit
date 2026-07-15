export declare function encrypt(data: any): Promise<{
    encrypted: string;
    iv: string;
}>;
export declare function decrypt(encryptedData: any, iv: any): Promise<string>;
export declare function hash(data: any, type?: string): string;
