import type {Format} from "./types";
import prettier from "prettier/standalone";
import javaPlugin from "prettier-plugin-java";
import Base from "./base";

export const formatter: Format<"java"> = new (class extends Base<'java'> {
    async beautify(): Promise<string> {
        return prettier.format(this.code, {
            plugins: [javaPlugin],
            parser: "java",
            tabWidth: this.getOptionValue('tab', 4)
        });
    }
})
