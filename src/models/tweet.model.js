import mongoose, {Schema} from "mongoose";


const TweetSchema=new Schema(
    {
         content:
         {
            type:String,
            required
         },
         owner:
         {
            type: Schema.Types.ObjectId,
            ref:"User"
         }
    },
    {
        timestamps:true
    }
)


export const Tweet=mongoose.model("Tweet",TweetSchema);