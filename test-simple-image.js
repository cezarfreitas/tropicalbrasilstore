const { isValidImageUrl } = require("./server/lib/image-uploader.ts");

const testUrl =
  "https://projetoinfluencer.vteximg.com.br/arquivos/ids/6953678-640-960/Chinelo-Tropical-Brasil-Institucion-Flip-Flop-Branco-Com-Azul.jpg";

console.log("URL a testar:", testUrl);
console.log("É válida?", isValidImageUrl(testUrl));
