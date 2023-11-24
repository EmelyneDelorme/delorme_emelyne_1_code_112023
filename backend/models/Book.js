const mongoose = require("mongoose");

const bookSchema = mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  imageUrl: { type: String, required: true },
  year: { type: Number, required: true },
  ratings: [
    {
      userId: { type: String, require: true },
      grade: { type: Number, require: true, min: 0, max: 5 },
    },
  ],
  averageRating: { type: Number, require: true, min: 0, max: 5 },
});

module.exports = mongoose.model("Book", bookSchema);
