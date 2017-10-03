/**
 * Created by Veket on 2017/10/3.
 * 设置http header：
 * 1.设置no-cache，避免IE缓存get请求而不再请求service
 */
module.exports=function(req,res,next){
    res.set('Cache-Control','no-cache');
    next();
};