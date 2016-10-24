/**
 * Created by Veket on 2016/10/24.
 */
var express=require('express');
var router=module.exports=express.Router();
router.get('/',function (req,res) {
    res.redirect('main.html');//前端页面入口
});