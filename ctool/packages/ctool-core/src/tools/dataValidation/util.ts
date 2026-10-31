import radix from "@/helper/radix";
import {padStart} from "lodash";
import Text from "@/helper/text";
import crcHandle from 'crc';
import {checksumBytes,crcAlgorithms} from "ctool-tools/domains/checksums";

export type CrcType = keyof typeof crcHandle;
export const crcTypeLists = crcAlgorithms as CrcType[]

export const bcc = (text: Text) => checksumBytes(text.toUint8Array(),"bcc");
export const lrc = (text: Text) => checksumBytes(text.toUint8Array(),"lrc");
export const crc = async (text: Text,type: CrcType) => {
    const value=checksumBytes(text.toUint8Array(),type);
    // Keep the existing UI's Modbus wire-order display.
    return type === "crc16modbus" ? ((value&255)<<8)|((value>>8)&255) : value;
};

export const result = (value: number, type: string) => {
    type = type.toLowerCase()
    if (type === "oct") {
        return radix(value, 10, 8)
    }
    if (type === "hex") {
        const temp = radix(value, 10, 16)
        return padStart(temp, Math.ceil(temp.length / 2) * 2, "0")
    }
    if (type === "bin") {
        const temp = radix(value, 10, 2)
        return padStart(temp, Math.ceil(temp.length / 8) * 8, "0")
    }
    return `${value}`
}
