require(`http`).createServer((req, res) => {
  if (req.url === `/`) {
   res.end(require(`fs`).readFileSync(__dirname + `/index.html`).toString());
   return;
  }
  if (req.url === `/index.js`) {
   res.end(require(`fs`).readFileSync(__dirname + `/index.js`).toString());
   return;
  }
  if (req.url === `/binary`) {
   res.end(require(`fs`).readFileSync(__dirname + `/binary.txt`).toString());
   return;
  }
  if (req.url === `/binary-imports`) {
   res.end(require(`fs`).readFileSync(__dirname + `/binary-imports.txt`).toString());
   return;
  }
  if (req.url === `/compiler`) {
   res.end(require(`fs`).readFileSync(__dirname + `/compiler.txt`).toString());
   return;
  }
  if (req.url === `/compiler-new`) {
   res.end(require(`fs`).readFileSync(__dirname + `/compiler-new.txt`).toString());
   return;
  }
  console.log(req.url);
 }).listen(3000);