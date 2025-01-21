import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("Uploading file:", file.originalname); // Log the file being uploaded
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    console.log("Saving file as:", file.originalname); // Log the filename being saved
    cb(null, file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    console.log("File accepted:", file.originalname); // Log accepted files
    cb(null, true);
  } else {
    console.log("File rejected:", file.originalname); // Log rejected files
    cb(null, false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } // 5MB file size limit
});
