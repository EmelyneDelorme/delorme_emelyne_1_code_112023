const sharp = require("sharp");
const path = require("path");

module.exports = (req, res, next) => {
  //On vérifie si la requête contient un fichier et si ce dernier a un contenu binaire.
  console.log(req.file);
  if (req.file && req.file.buffer) {
    console.log("ok on rentre dans le if");
    const name = req.file.originalname.split(" ").join("_");
    const extension = path.extname(name);
    const fileName = name.replace(extension, "");
    const outputFileName = `${fileName}_${Date.now()}.webp`;
    const outputPath = path.join(__dirname, "..", "images", outputFileName);
    req.file.filename = sharp(req.file.buffer)
      .toFormat("webp", { quality: 50 })
      .resize(300, 500, {
        fit: sharp.fit.inside,
        withoutEnlargement: true,
      })
      .toFile(outputPath, (error) => {
        if (error) {
          console.error("Sharp error:", error);
          return res
            .status(500)
            .json({ error: "Erreur lors de l'optimisation de l'image." });
        }

        //On stocke le nom du fichier généré par Sharp dans req.sharpFileName (pour l'utiliser
        //dans les controllers)
        req.sharpFileName = outputFileName;

        next();
      });
  } else {
    console.log("Image non modifiée");
    next();
  }
};
