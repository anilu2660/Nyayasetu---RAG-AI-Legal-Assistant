export declare function initAgent(): Promise<void>;
export declare function isLegalQuery(query: string): boolean;
/**
 * Main query entry point. Returns a generator/iterator representing the stream of tokens.
 */
export declare function streamLegalAssistantResponse(query: string, chatId: string, userId: string, documentName?: string): AsyncGenerator<string, void, unknown>;
