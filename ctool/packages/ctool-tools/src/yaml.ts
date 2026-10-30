// https://github.com/nodeca/js-yaml/issues/614

import yaml from "js-yaml"

// @ts-ignore
const options = Object.assign({}, yaml.types.int.options);

options.construct = (data: string) => {
    let value = data; let sign = 1n; let ch;

    if (value.indexOf('_') !== -1) {
        value = value.replace(/_/g, '');
    }

    ch = value[0];
    if (ch === '-' || ch === '+') {
        if (ch === '-') sign = -1n;
        value = value.slice(1);
        ch = value[0];
    }
    if (Number.isSafeInteger(Number(sign) * Number(value))) {
        return Number(sign) * Number(value)
    }
    return sign * BigInt(value);
};


options.predicate = (object: unknown) => {
    return Object.prototype.toString.call(object) === '[object BigInt]'
        // @ts-ignore
        || yaml.types.int.options.predicate(object);
};


const BigIntType = new yaml.Type('tag:yaml.org,2002:int', options);

const SCHEMA = yaml.DEFAULT_SCHEMA.extend({implicit: [BigIntType]});

export default {
    dump: (data: unknown) => {
        return yaml.dump(data, {schema: SCHEMA})
    },
    load: (data: string) => {
        return yaml.load(data, {schema: SCHEMA})
    }
}
