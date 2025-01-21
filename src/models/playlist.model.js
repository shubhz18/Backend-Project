import mongoose, {Schema} from "mongoose";


const playListSchema=new Schema(
    {
       name:
       {
        type:String,
        require,
       },
       description:
       {
        type:String,
        require,
       },
       videos:[
       {
        type:Schema.Types.ObjectId,
        ref:"Video"
       }],
       owner:
       {
        type:Schema.Types.ObjectId,
        ref:"User"
       }

    },
{
    timestamps:true
}
)



export const PlayList=mongoose.model("PlayList",playListSchema)