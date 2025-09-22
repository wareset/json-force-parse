export default function jsonLikeParse(text: string, reviver?: (this: any[] | {
    [key: string]: any;
}, key: string, value: boolean | number | string | null | any[] | {
    [key: string]: any;
}, context: {
    source?: string;
}) => any): string;
