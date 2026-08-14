const Listing = require("../models/listing.js");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// module.exports.index = async (req, res) => {
//   const allListings = await Listing.find({});
//   res.render("listings/index.ejs", { allListings });
// };

module.exports.index = async (req, res) => {
  const { category, search } = req.query;
  let allListings;

  if (category) {
    allListings = await Listing.find({ category: category });
  } else if (search) {
    let query = {
      $or: [
        { title: { $regex: String(search), $options: "i" } },
        { location: { $regex: String(search), $options: "i" } },
        { country: { $regex: String(search), $options: "i" } },
      ],
    };

    if (!isNaN(search) && search.trim() !== "") {
      query.$or.push({ price: Number(search) });
    }

    allListings = await Listing.find(query).populate("likes");
  } else {
    allListings = await Listing.find({}).populate("likes");
  }

  res.render("listings/index.ejs", {
    allListings,
    isSearched: category || search ? true : false,
  });
};

module.exports.renderNewForm = (req, res) => {
  console.log(req.user);
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }
  console.log(listing);
  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
  let response = await geocodingClient
    .forwardGeocode({
      query: req.body.listing.location,
      limit: 1,
    })
    .send();

  let url = req.file.path;
  let filename = req.file.filename;
  console.log(url, "..", filename);
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };
  newListing.geometry = response.body.features[0].geometry;
  let savedListing = await newListing.save();
  console.log(savedListing);
  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  // if(!listing) {
  //   req.flash("error" , "Listing you requested for does not exist! ");
  //   res.redirect("/listings");
  // }
  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }
  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};

module.exports.toggleLike = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      req.flash("error", "You must be logged in to like listings!");
      return res.json({ success: false, redirect: "/login" });
    }
    const { id } = req.params;
    const userId = req.user._id;
    let isLiked = false;
    const listing = await Listing.findById(id);
    if (!listing.likes) {
      listing.likes = [];
    }
    if (listing.likes.includes(userId)) {
      await Listing.findByIdAndUpdate(id, { $pull: { likes: userId } });
      isLiked = false;
    } else {
      await Listing.findByIdAndUpdate(id, { $push: { likes: userId } });
      isLiked = true;
    }
    const updatedListing = await Listing.findById(id).populate("likes");
    return res.json({
      success: true,
      isLiked: isLiked,
      likesCount: updatedListing.likes.length,
      lastLikedUsername: updatedListing.likes.length > 0
        ? updatedListing.likes[updatedListing.likes.length - 1].username
        : null,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
