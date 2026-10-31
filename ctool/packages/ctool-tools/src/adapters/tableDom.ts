import createDOMPurify from "dompurify";
import type {WindowLike} from "dompurify";
import {setTableReader} from "../domains/serialize/table";
export function configureTableDom(window:WindowLike & {DOMParser:typeof DOMParser}) {
    const purify=createDOMPurify(window);
    setTableReader(html=>{
        const clean=purify.sanitize(html,{USE_PROFILES:{html:true},FORBID_TAGS:["img","iframe","style","link","video","audio","source"]});
        const document=new window.DOMParser().parseFromString(clean,"text/html");
        const table=document.querySelector('table');if(!table)throw new Error('没有找到HTML表格');
        const rows=Array.from(table.querySelectorAll('tr'));if(!rows.length)throw new Error('表格没有表头或数据');
        return {headers:Array.from(rows[0]?.querySelectorAll('td,th') ?? [],cell=>cell.innerHTML),rows:rows.slice(1).map(row=>Array.from(row.querySelectorAll('td'),cell=>cell.innerHTML))};
    });
}
