/**
 * Created by Veket on 2016/10/24.
 */
var logger=AppCtx.Logger('test-model.js');

var _=require('lodash');

module.exports=function(){
    var _super=AppCtx.BaseModel('test','id',logger);
    var s = _.extend({},_super);

    return s;
};