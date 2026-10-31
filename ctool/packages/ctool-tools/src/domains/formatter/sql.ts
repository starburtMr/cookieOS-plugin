import type {Format} from "./types";
import {format} from 'sql-formatter';
import Base from "./base";

export const formatter: Format<"sql"> = new (class extends Base<'sql'> {
    async beautify(): Promise<string> {
        return format(this.code, {
            language: this.option?.language || "sql",
            tabWidth: this.getOptionValue('tab', 4)
        });
    }

    async compress(): Promise<string> {
        return this.code.replace(/\s+/g, " ").replace(/\s+\(/, "(").replace(/\s+\)/, ")")
    }
})
