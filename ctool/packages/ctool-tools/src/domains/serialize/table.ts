import {formatRows} from "./rowFormat";
import {unescape, escape, isArray} from "lodash";
export type TableRows={headers:string[];rows:string[][]};
let readHtml: ((html:string)=>TableRows)|undefined;
export const setTableReader=(reader:(html:string)=>TableRows)=>{readHtml=reader;};
const readTable=(html:string)=>{if(html.length>204800)throw new Error("表格过大，请减少内容");if(!readHtml)throw new Error("表格解析环境不可用");return readHtml(html);};

const nodeFilter = (item: string): string => {
    if (item === null) {
        return "";
    }
    const re = new RegExp("</?\\w+((\\s+\\w+(\\s*=\\s*(?:\".*?\"|'.*?'|[^'\">\\s]+))?)+\\s*|\\s*)/?>", 'g');
    item = item.replace(/\r\n|\r|\n/g, ' ');
    item = item.replace(/\n|<br>|<br\/>|<br \/>/gi, '\n');
    item = item.replace(re, '');
    item = unescape(item);
    item = item.replace(/&nbsp;/gi, " ");
    return item.trim();
}

export const tableKeys = (table) => {
    table = table.trim();
    if (!table) {
        return [];
    }
    const result=readTable(table).headers.map(nodeFilter);
    return result;
}

export const parse = (table = "", {
    keyed_key = 0,
    type = "row_object"
} = {}) => {
    table = table.trim();
    if (!table) {
        return "";
    }
    const parsed=readTable(table);
    const keys=parsed.headers.map(nodeFilter);
    const result=parsed.rows.map(row=>Object.fromEntries(keys.map((key,index)=>[key,nodeFilter(row[index] ?? "")])));
    return formatRows(
        result,
        type,
        keyed_key
    )
}


const stringify = (json:any, {header = true} = {}) => {
    if (!isArray(json) || json.length < 1) {
        throw new Error("records is not iterable")
    }
    const html = ["<table>"];
    const keys = Object.keys(json[0])
    if (header) {
        html.push(
            '<thead>',
            '<tr>',
            ...keys.map((item) => {
                return `<th>${escape(String(item))}</th>`
            }),
            '</tr>',
            '</thead>'
        )
    }
    html.push("<tbody>")
    for (const row of json) {
        html.push("<tr>", ...keys.map((item) => {
            return `<td>${escape(String(item in row ? row[item] : ""))}</td>`
        }), '</tr>');
    }
    html.push("</tbody></table>")
    return html.join("")
}

export default {
    parse, stringify
}
