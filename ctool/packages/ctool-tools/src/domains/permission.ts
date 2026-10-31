export function permissionFormat(matrix:boolean[][],special:boolean[]) {
    const digits=matrix.map(row=>(row[0]?4:0)+(row[1]?2:0)+(row[2]?1:0));
    const sp=(special[0]?4:0)+(special[1]?2:0)+(special[2]?1:0);
    const octal=(sp?String(sp):'')+digits.join('');
    const symbolic=matrix.map(([r,w,x],i)=>(r?'r':'-')+(w?'w':'-')+(special[i]?(x?i===2?'t':'s':i===2?'T':'S'):x?'x':'-')).join('');
    return {octal,symbolic,matrix,special};
}
export function permissionParse(value:string) {
    if(/^[0-7]{3,4}$/.test(value)) {
        const digits=value.padStart(4,'0').split('').map(Number);
        return permissionFormat(digits.slice(1).map(v=>[Boolean(v&4),Boolean(v&2),Boolean(v&1)]),[4,2,1].map(v=>Boolean(digits[0]&v)));
    }
    if(!/^[r-][w-][xsS-][r-][w-][xsS-][r-][w-][xtT-]$/.test(value))throw new Error('权限格式不正确');
    return permissionFormat([0,3,6].map(i=>[value[i]==='r',value[i+1]==='w',/[xst]/.test(value[i+2])]),[2,5,8].map(i=>/[st]/i.test(value[i])));
}
