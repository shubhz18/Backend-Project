import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";



const CommentSchema=new Schema(
    {
        
        content:{
            type:String,
            required:true
        },
        owner:
        {
            type:Schema.Types.ObjectId,
            ref:"User"
        },
        video:
        {
             type:Schema.Types.ObjectId,
             ref:"Video"
        },    
    },
    {
        timestamps:true
    }
)


CommentSchema.plugin(mongooseAggregatePaginate)

export const Comment=mongoose.model("Comment",CommentSchema)
