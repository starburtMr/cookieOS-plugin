import {Buffer} from "node:buffer";
import sharp from "sharp";
import {JSDOM} from "jsdom";
import * as canvas from "canvas";
import QR from "qr-code-styling";
import jsQR from "jsqr";
import JsBarcode from "jsbarcode";
import {decodeIco} from "icojs";
import {decode as decodeBmp} from "bmp-ts";
import {merge} from "lodash";
import {ToolError} from "ctool-tools";
import {generateOptionsHandle,defaultGenerateOption} from "ctool-tools/domains/qrOptions";

async function image(bytes:Uint8Array) {
    if(bytes.length>8388608)throw new ToolError('input_limit','图片超过8 MiB');
    const buffer=Buffer.from(bytes);
    const pixels=(w:number,h:number)=>{if(!Number.isSafeInteger(w)||!Number.isSafeInteger(h)||w<1||h<1||w*h>4194304)throw new ToolError('input_limit','图片超过400万像素');};
    if(buffer.subarray(0,2).toString()==='BM') {
        if(buffer.length<26)throw new ToolError('invalid_arguments','BMP内容不完整');
        const core=buffer.readUInt32LE(14)===12;
        pixels(core?buffer.readUInt16LE(18):buffer.readInt32LE(18),Math.abs(core?buffer.readUInt16LE(20):buffer.readInt32LE(22)));
        const decoded=decodeBmp(buffer,{toRGBA:true});pixels(decoded.width,decoded.height);
        return sharp(decoded.data,{raw:{width:decoded.width,height:decoded.height,channels:4}});
    }
    if(buffer.length>=6&&buffer.readUInt32LE(0)===65536) {
        const count=buffer.readUInt16LE(4);if(count<1||count>32||buffer.length<6+16*count)throw new ToolError('input_limit','图标帧数过多或格式不正确');
        let total=0;
        for(let i=0;i<count;i++) {
            const entry=6+i*16;const length=buffer.readUInt32LE(entry+8); const offset=buffer.readUInt32LE(entry+12);
            if(offset<6+count*16||offset+length>buffer.length||length<12)throw new ToolError('invalid_arguments','图标数据不完整');
            const part=buffer.subarray(offset,offset+length);let w:number,h:number;
            if(part.subarray(1,4).toString()==='PNG'){const meta=await sharp(part,{limitInputPixels:4194304}).metadata();w=meta.width ?? 0;h=meta.height ?? 0;}
            else {const core=part.readUInt32LE(0)===12;w=core?part.readUInt16LE(4):part.readInt32LE(4);h=Math.abs(core?part.readUInt16LE(6):part.readInt32LE(8))/2;}
            pixels(w,h);total+=w*h;if(total>4194304)throw new ToolError('input_limit','图标总像素超过400万');
        }
        const frames=await decodeIco(buffer,'image/png');const largest=frames.sort((a,b)=>b.width*b.height-a.width*a.height)[0];
        return sharp(Buffer.from(largest.buffer),{limitInputPixels:4194304});
    }
    const loader=sharp(bytes,{limitInputPixels:4194304,animated:false});const meta=await loader.metadata();
    if(!meta.width||!meta.height||meta.width*meta.height>4194304)throw new ToolError('input_limit','图片超过400万像素');
    if(!['png','jpeg','webp','gif'].includes(meta.format ?? ''))throw new ToolError('unsupported_format','请使用PNG、JPEG、WebP、GIF、BMP或ICO图片');
    return loader;
}
async function scan(bytes:Uint8Array) {
    const {data,info}=await (await image(bytes)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const result=jsQR(new Uint8ClampedArray(data),info.width,info.height);
    if(!result)throw new ToolError('not_found','没有识别到二维码，请提高尺寸、纠错等级或减小Logo');
    return result;
}
export async function imageOperation(name:string,a:Record<string,any>) {
    if(name==='qrcode_read')return {text:(await scan(a.bytes)).data};
    const format=a.format ?? 'png';let svg:Buffer;
    if(name==='qrcode_generate') {
        const option=merge(defaultGenerateOption(),a.options ?? {},{is_show:true});
        let logo='';
        if(a.logoBytes) {const bytes=await (await image(a.logoBytes)).png().toBuffer();logo='data:image/png;base64,'+bytes.toString('base64');}
        const options=generateOptionsHandle(option,a.text,{isImage:()=>Boolean(logo),toDataUrl:()=>logo});
        const loaded=QR as unknown as {QRCodeStyling?:typeof QR;default?:typeof QR};const Constructor=loaded.QRCodeStyling ?? loaded.default ?? QR;
        const code=new Constructor({...options,width:a.size ?? options.width,height:a.size ?? options.height,type:'svg',jsdom:JSDOM,nodeCanvas:canvas});
        svg=Buffer.from(await code.getRawData('svg') as Buffer);
    } else if(name==='barcode_generate') {
        const dom=new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
        try{const element=dom.window.document.querySelector('svg')!;JsBarcode(element,a.text,{...a.options,xmlDocument:dom.window.document});svg=Buffer.from(element.outerHTML);}finally{dom.window.close();}
    } else throw new ToolError('unknown_tool','工具不存在');
    const output=await sharp(svg,{limitInputPixels:4194304}).toFormat(format).toBuffer();
    if(name==='qrcode_generate'&&(await scan(output)).data!==a.text)throw new ToolError('invalid_result','二维码回读不一致，请调整样式、尺寸和Logo');
    if(output.length>16777216)throw new ToolError('output_limit','生成图片过大');
    return {bytes:output,mime:'image/'+format};
}
