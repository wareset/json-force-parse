export default function parseJson(s: string, reviver?: null | {
    (this: any[] | {
        [key: string]: any;
    }, key: string, value: boolean | number | string | null | any[] | {
        [key: string]: any;
    }, context: {
        source?: string;
    }): any;
}, createObjectsWithPrototype?: boolean): any;
