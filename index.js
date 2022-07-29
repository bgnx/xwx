let byteToHexString = (uint8arr) => {
  let hexStr = ``;
  for (let i = 0; i < uint8arr.length; i++) {
    let hex = (uint8arr[i] & 0xff).toString(16);
    hex = (hex.length === 1) ? `0` + hex : hex;
    hexStr += hex + ` `;
  }
  return hexStr.slice(0, -1);
}
let hexStringToByte = (str) => {
  let arr = [];
  for (let i = 0, len = str.length; i < len; i += 3) {
    arr.push(parseInt(str.substr(i, 2), 16));
  }
  return Uint8Array.from(arr);
};

let getVal = (mem, out) => mem[out] + (mem[out + 1] << 8) + (mem[out + 2] << 16) + (mem[out + 3] << 24);

(async () => {
  let code = "(" + (await fetch(`/compiler`).then(res => res.text())) + ")"
  let newCode = "(" + (await fetch(`/compiler-new`).then(res => res.text())) + ")";
  let binary = hexStringToByte(await fetch(`/binary`).then(res => res.text()));
  let binaryImports = JSON.parse(await fetch(`/binary-imports`).then(res => res.text()));

  let execute = async (buf, imports, code) => {
    Object.keys(imports).forEach(key=>imports[key] = Function(`return ${imports[key]}`)());
    //console.log(code.slice(4821))
    let wasmInstance = await WebAssembly.instantiate(buf, {env: imports});
    let mem = new Uint8Array(wasmInstance.instance.exports.memory.buffer);
    code.split(``).forEach((it, i) => mem[i] = it.charCodeAt(0));
    let inputLength = BigInt(code.length);
    window.__wasm = wasmInstance.instance.exports;
    window.__code = code;
    let out = wasmInstance.instance.exports.main(inputLength);
    out = Number(out);
    //console.log(out);
    //console.log(mem.slice(0, 500))
    let binaryLength = mem[out] + (mem[out + 1] << 8) + (mem[out + 2] << 16) + (mem[out + 3] << 24)
    out += 4;
    if (mem[out] + (mem[out + 1] << 8) + (mem[out + 2] << 16) + (mem[out + 3] << 24) === 0x6d736100) {
      let newBuf = mem.slice(out, out + binaryLength);
      out += binaryLength;
      let importsCount = mem[out] + (mem[out + 1] << 8) + (mem[out + 2] << 16) + (mem[out + 3] << 24);
      out += 4;
      let imports = {};
      for (let i = 0; i < importsCount; i++) {
        let namePtr = getVal(mem, out); out += 4;
        let valuePtr = getVal(mem, out); out += 4;
        let nameStrLen = getVal(mem, namePtr);
        let valueStrLen = getVal(mem, valuePtr);
        let nameStr = "";
        for(let i = 0; i < nameStrLen; i++){
          nameStr += String.fromCharCode(mem[namePtr + 4 + i]);
        }
        let valueStr = "";
        for(let i = 0; i < valueStrLen; i++){
          valueStr += String.fromCharCode(mem[valuePtr + 4 + i]);
        }
        imports[nameStr] = valueStr;
      }
      return {res: newBuf, imports};
    } else {
      console.log(`error:`, out - 4);
    }
  };
  let {res, imports} = await execute(binary, binaryImports, code);
  //console.log(res);
  console.log(res.toString() === binary.toString());
  let {res: res2, imports: imports2} = await execute(res, imports, newCode);
  //console.log(res2);
  console.log(res.toString() === res2.toString());
  let {res: res3, imports: imports3} = await execute(res2, imports2, newCode);
  //console.log(res3);
  console.log(res2.toString() === res3.toString());
  console.log(byteToHexString(res3));
  console.log(JSON.stringify(imports3));
})();