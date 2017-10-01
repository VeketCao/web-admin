/**
 * Created by Veket on 2017/9/29.
 */
var logger=AppCtx.Logger('user-model.js');

var _=require('lodash');

module.exports=function(){
    var _super=AppCtx.BaseModel('USER_INFO','USER_ID',logger);
    var s = _.extend({},_super);

    return s;
};