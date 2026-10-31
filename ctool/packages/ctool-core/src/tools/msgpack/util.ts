import { decode, encode } from "@msgpack/msgpack";
import Serialize from "@/helper/serialize";
import Text from "@/helper/text";
import {normalizeMsgpack as normalizeDecodedValue} from "ctool-tools/domains/msgpack";

export {normalizeMsgpack as normalizeDecodedValue} from "ctool-tools/domains/msgpack";

export const encodeMsgpack = (data: Serialize): Text => {
    if (data.isEmpty()) {
        return Text.empty();
    }

    if (data.isError()) {
        return Text.fromError(data.error());
    }

    try {
        return Text.fromUint8Array(
            encode(data.content(), {
                useBigInt64: true,
            }),
        ).setExtension(".msgpack");
    } catch (e) {
        return Text.fromError($error(e));
    }
};

export const decodeMsgpack = (data: Text): Serialize => {
    if (data.isEmpty()) {
        return Serialize.empty();
    }

    if (data.isError()) {
        return Serialize.fromError(data.toString());
    }

    try {
        const decoded = decode(data.toUint8Array(), {
            useBigInt64: true,
        });
        const normalized = normalizeDecodedValue(decoded);
        if (normalized !== null && typeof normalized === "object") {
            return Serialize.formObject(normalized as object);
        }
        return Serialize.formObject({ value: normalized });
    } catch (e) {
        return Serialize.fromError($error(e));
    }
};
