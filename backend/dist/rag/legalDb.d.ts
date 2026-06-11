export interface LegalTopic {
    id: string;
    title: string;
    category: string;
    provisions: string[];
    content: string;
    source: string;
}
export declare const INDIAN_LEGAL_DB: LegalTopic[];
