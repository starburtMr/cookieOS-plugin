import {formatRows} from "./rowFormat";
import {parse as csvParse} from 'csv-parse/sync';
import {stringify as csvStringify} from 'csv-stringify/sync';

export const getKeyedField = (csv: string) => {
    return Object.keys(csvParse(csv, {columns: true, skip_empty_lines: true})[0] || {})
}

export const parse = (csv = "", {type = "row_object", keyed_key = 0} = {}) => {
    return formatRows(
        csvParse(csv, {columns: true, skip_empty_lines: true}),
        type,
        keyed_key
    )
}

const stringify = (json: any, {quoted = false, header = true} = {}) => {
    return csvStringify(json, {quoted, header})
}

export default {
    parse,
    stringify
}
