import mongoose,{ Schema } from "mongoose"

const subscriptionSchema = new Schema({
    subsriber: {
        type: Schema.Types.ObjectId, // one who is subsribing
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId, // one to whom the 'subscriber' is subsribing
        ref: "User"
    }
},{timestamps: true})


export const Subscription = mongoose.model("Subsription",subscriptionSchema);