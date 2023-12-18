const Book = require("../models/Book");
const fs = require("fs");

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject._userId;
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });

  book
    .save()
    .then(() => {
      res.status(201).json({ message: "Livre enregistré !" });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.modifyBook = (req, res, next) => {
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };

  delete bookObject._userId;
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
      } else {
        Book.updateOne(
          { _id: req.params.id },
          { ...bookObject, _id: req.params.id }
        )
          .then(() => res.status(200).json({ message: "Livre modifié!" }))
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
      } else {
        const filename = book.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Livre supprimé !" });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({ error }));
};

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};

exports.ratingBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id }).then((book) => {
    const isAlreadyRated = book.ratings.some(
      (rate) => rate.userId === req.body.userId
    );
    if (isAlreadyRated) {
      res.status(403).json({ message: "Already rated" });
    } else {
      try {
        const bookRating = {
          userId: req.body.userId,
          grade: req.body.rating,
        };
        const newRatings = [...book.ratings, bookRating];
        const newAverage =
          newRatings.reduce((sum, rating) => sum + rating.grade, 0) /
          newRatings.length;

        Book.findOneAndUpdate(
          { _id: req.params.id },
          { ratings: newRatings, averageRating: newAverage },
          { new: true }
        )
          .then((updatedBook) => {
            res
              .status(200)
              .json({ message: "Rated successfully", updatedBook });
          })
          .catch((updateError) => {
            res.status(500).json({ message: "Error rating the book" });
          });
      } catch (e) {
        res.status(409).json({ error });
      }
    }
  });
};

exports.getBestRating = (req, res, next) => {
  Book.find()
    .then((books) => {
      const bestratings = books
        .sort((a, b) => b.averageRating - a.averageRating)
        .splice(0, 3);
      res.status(200).json(bestratings);
    })
    .catch((error) => res.status(400).json({ error }));
};
