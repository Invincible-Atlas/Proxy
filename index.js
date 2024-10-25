const express = require('express')
var path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const mt = require("mime-types");
const cookieParser = require("cookie-parser");
let log = "";
let urlRegex = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i;
(()=>{const directory = "temp";

    fs.readdir(directory, (err, files) => {
      if (err) throw err;
    
      for (const file of files) {
        fs.unlink(path.join(directory, file), (err) => {
          if (err) throw err;
        });
      }
    });})()
function readFile(filePath) {
    try {
      const data = fs.readFileSync(filePath);
      return data.toString();
    } catch (error) {
      console.error(`Got an error trying to read the file: ${error.message}`);
    }
}
function proxy(proxyURL,req,res){
  if(req.path.split("/")[req.path.split("/").length-1].includes(".")){
    mimeType = mt.lookup(req.path)
  }
  if(mimeType!==""){
      res.type(mimeType);
      console.log(mimeType);
  }
  if(mimeType!==""&&!res.getHeader("Content-Type").includes("charset=utf-")){
      fetch(proxyURL+req.path).then(res => res.blob()).then((blob)=>{
          // console.log(text);
          // console.log(req.path);   
          console.log("blob");
          let arrayBuffer;
          blob.arrayBuffer().then((ab)=>{
              arrayBuffer = ab;
          
              let buffer = Buffer.from(arrayBuffer);
              let b64 = buffer.toString('base64');
              // console.log("writing");
              fs.writeFileSync("temp/"+req.path.split("/")[req.path.split("/").length-1],b64,"base64",(err)=>{
                  console.error(err);
              });
              
              console.log(res.getHeader("Content-Type"));
              res.sendFile(path.join(__dirname,"/temp/"+req.path.split("/")[req.path.split("/").length-1]));
              // console.log("unlinking");
              // fs.unlinkSync(path.join(__dirname,"/temp/"+req.path.split("/")[req.path.split("/").length-1]));
              console.log("------------------------------------")

          })
      })
  }else{
      fetch(proxyURL+req.path).then(res => res.text()).then((text)=>{
          // console.log(text);
          // console.log(req.path);

          
          console.log(res.getHeader("Content-Type"));
          let modText = text;
          let matches = String(modText).match(urlRegex);
          for(const string of matches){
            modText.replace(string,"/nonrelative/"+string.replace(/(https?:\/\/|ftp:\/\/)/gmi,"").replace(/(?<=\.[a-zA-Z]*)\//gmi,"/s/").replace(".","/"));
          }

          res.send(modText);
          console.log("------------------------------------")
          
  })
  }
}
const app = express()
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
const port = 4001;
// app.use(express.static(path.join(__dirname, 'public')));
// let proxyURL = "https://theatlas.pages.dev";
app.get("/public/*",(req,res)=>{
    res.type(mt.lookup(req.path));
    console.log(readFile(path.join(__dirname,req.path)));
    res.send(readFile(path.join(__dirname,req.path)));
})
app.get("/proxy",(req,res)=>{
    res.sendFile("search.html");
})
app.get("/*", (req,res)=>{
    

    console.log(proxyURL+req.path);
    let mimeType = "";
    console.log(req.cookies);
    let proxyURL;
    if(urlRegex.test(req.cookies.search)){
      proxyURL = req.cookies.search;
    }else{
      proxyURL = "https://example.com"
    }
    proxy(proxyURL,req,res);
    
})
app.get("/nonrelative/*",(req,res)=>{
  let proxyURL = req.path.replace(/\/(?=.*\/s\/)/gmi,".").replace("/s/","/");
  proxy(proxyURL,req,res);
})
setInterval(async () => {
    
        (()=>{const directory = "temp";

            fs.readdir(directory, (err, files) => {
              if (err) throw err;
            
              for (const file of files) {
                fs.unlink(path.join(directory, file), (err) => {
                  if (err) throw err;
                });
              }
            });})()
    
}, 60000);


app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})