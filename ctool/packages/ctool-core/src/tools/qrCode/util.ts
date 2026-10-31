import Text from "@/helper/text";
import {runTask} from "@/helper/cookieos/task";
export * from "ctool-tools/domains/qrOptions";
export const parser = (text: Text,signal:AbortSignal) => runTask<string>("qr",{base64:text.toBase64()},signal);
