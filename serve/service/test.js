/**
 * Created by Veket on 2015/9/28.
 */
var express=require('express');
var router=module.exports=express.Router();
var logger=AppCtx.Logger('test.js');

router.get('/',function(req,res){
    logger.info("get...");
    res.json({data:"hello world"});
});

router.get('/:id',function(req,res){
    logger.info("get by id...");
    res.json({data:req.params});
});

router.post('/',function(req,res,next){
    logger.info("post...");
    res.json({data:req.body});
});

router.put('/',function(req,res,next){
    logger.info("put...");
    res.json({data:req.body});
});

router.delete('/:id',function(req,res,next){
    logger.info("delete by id...");
    res.json({data:req.params});
});