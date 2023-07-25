const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    seq: {
        type: Number,
        default: 0
    }
});

const Counter = mongoose.model("counter", counterSchema);

/**
 * Create Schema
 */
const urlSchema = new mongoose.Schema({
    original_url: {
      type: String,
      required: true,
      unique: true
    },
    short_url: {
      type: Number
    }
});

urlSchema.pre("save",function(next){
    var doc = this;
    Counter.findByIdAndUpdate({
        _id: "url_counter"
    },{
        $inc:{
            seq: 1
        }
    }, function(err,counter){
        if (err) {
            console.log(err);
            return next(err);
        }
        doc.short_url = counter.seq;
        next();
    })
})

/**
 * Create Model
 */
exports.UrlModel = mongoose.model("ShortURL",urlSchema);
exports.Counter = Counter;