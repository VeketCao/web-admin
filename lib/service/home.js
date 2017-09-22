/**
 * Created by Veket on 2016/10/24.
 */
var router=module.exports=require('express').Router();

router.get('/',function (req,res) {
    res.redirect('main.html');//前端页面入口
});